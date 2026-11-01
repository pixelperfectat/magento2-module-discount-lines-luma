<?php

declare(strict_types=1);

namespace PixelPerfect\DiscountLinesLuma\Test\Unit;

use PHPUnit\Framework\TestCase;

class AssetsTest extends TestCase
{
    private const MODULE_DIR = __DIR__ . '/../../src';

    public function testMixinsAreRegisteredForSummaryAndCartDiscountComponents(): void
    {
        $config = (string)file_get_contents(self::MODULE_DIR . '/view/frontend/requirejs-config.js');
        $map = [
            'Magento_SalesRule/js/view/summary/discount' => 'discount-lines-mixin',
            'Magento_SalesRule/js/view/cart/totals/discount' => 'cart-mixin',
        ];

        foreach ($map as $component => $mixin) {
            self::assertMatchesRegularExpression(
                '#\'' . preg_quote($component, '#') . '\':\s*\{\s*\'PixelPerfect_DiscountLinesLuma/js/view/'
                . preg_quote($mixin, '#') . '\': true#',
                $config
            );
            self::assertFileExists(self::MODULE_DIR . '/view/frontend/web/js/view/' . $mixin . '.js');
        }
    }

    public function testBaseStylesheetIsLoadedOnCartAndCheckout(): void
    {
        foreach (['checkout_cart_index', 'checkout_index_index'] as $handle) {
            $xml = simplexml_load_file(self::MODULE_DIR . '/view/frontend/layout/' . $handle . '.xml');
            self::assertCount(1, $xml->xpath('//css[@src="PixelPerfect_DiscountLines::css/discount-lines.css"]'), $handle);
        }
    }

    public function testConfigProviderIsRegisteredInTheCheckoutComposite(): void
    {
        $xml = simplexml_load_file(self::MODULE_DIR . '/etc/frontend/di.xml');

        self::assertCount(
            1,
            $xml->xpath('//type[@name="Magento\Checkout\Model\CompositeConfigProvider"]//item[@name="pp_discount_lines_luma"]')
        );
    }

    public function testModuleLoadsAfterBaseModuleAndCoreCheckout(): void
    {
        $xml = simplexml_load_file(self::MODULE_DIR . '/etc/module.xml');
        $modules = array_map('strval', $xml->xpath('//sequence/module/@name'));

        self::assertContains('PixelPerfect_DiscountLines', $modules);
        self::assertContains('Magento_SalesRule', $modules);
        self::assertContains('Magento_Checkout', $modules);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function templates(): array
    {
        $dir = self::MODULE_DIR . '/view/frontend/web/template/summary/';

        return ['lines' => [$dir . 'discount-lines.html'], 'chip' => [$dir . 'chip.html']];
    }

    /**
     * @dataProvider templates
     */
    public function testTemplatesBindTextOnlyAndHaveNoInlineStyles(string $file): void
    {
        $template = (string)file_get_contents($file);

        self::assertDoesNotMatchRegularExpression('/\bhtml\s*:/', $template);
        self::assertStringNotContainsString('style=', $template);
        self::assertStringNotContainsString('innerHTML', $template);
    }

    public function testTemplateFallsBackToCoreTitleAndValueWithoutLines(): void
    {
        $template = (string)file_get_contents(self::templates()['lines'][0]);

        self::assertStringContainsString('ifnot: hasLines()', $template);
        self::assertStringContainsString('text: getTitle()', $template);
        self::assertStringContainsString('text: getValue()', $template);
    }

    public function testCouponRemovalIsARealLabelledButton(): void
    {
        $chip = (string)file_get_contents(self::templates()['chip'][0]);

        self::assertStringContainsString('<button type="button" class="pp-dl__remove"', $chip);
        self::assertStringContainsString("'aria-label': getRemoveLabel", $chip);
    }

    public function testGermanTranslationCoversEveryString(): void
    {
        $read = static fn (string $f): array => array_column(
            array_map(static fn (string $l): array => str_getcsv($l, ',', '"', ''), file($f)),
            0
        );

        self::assertSame(
            $read(self::MODULE_DIR . '/i18n/en_US.csv'),
            $read(self::MODULE_DIR . '/i18n/de_DE.csv')
        );
    }
}
