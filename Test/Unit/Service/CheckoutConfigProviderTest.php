<?php

declare(strict_types=1);

namespace PixelPerfect\DiscountLinesLuma\Test\Unit\Service;

use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use PixelPerfect\DiscountLines\ViewModel\DiscountLines;
use PixelPerfect\DiscountLinesLuma\Service\CheckoutConfigProvider;

class CheckoutConfigProviderTest extends TestCase
{
    /** @var DiscountLines&MockObject */
    private DiscountLines $discountLines;

    protected function setUp(): void
    {
        $this->discountLines = $this->createMock(DiscountLines::class);
        $this->discountLines->method('getIconUrl')
            ->willReturnCallback(static fn (string $kind): string => 'https://example.com/' . ($kind ?: 'tag') . '.svg');
    }

    public function testExposesEnabledFlagAndUppercaseVariant(): void
    {
        $this->discountLines->method('isEnabled')->willReturn(true);
        $this->discountLines->method('getVariant')->willReturn('c');

        $config = (new CheckoutConfigProvider($this->discountLines))->getConfig()['ppDiscountLines'];

        self::assertTrue($config['enabled']);
        self::assertSame('C', $config['variant']);
    }

    public function testExposesDisabledState(): void
    {
        $this->discountLines->method('isEnabled')->willReturn(false);
        $this->discountLines->method('getVariant')->willReturn('B');

        $config = (new CheckoutConfigProvider($this->discountLines))->getConfig()['ppDiscountLines'];

        self::assertFalse($config['enabled']);
    }

    public function testProvidesIconPerKindAndDefault(): void
    {
        $this->discountLines->method('getVariant')->willReturn('B');

        $config = (new CheckoutConfigProvider($this->discountLines, ['coupon', 'gift']))
            ->getConfig()['ppDiscountLines'];

        self::assertSame(
            ['default' => 'https://example.com/tag.svg', 'coupon' => 'https://example.com/coupon.svg', 'gift' => 'https://example.com/gift.svg'],
            $config['icons']
        );
    }

    public function testProvidesTranslatedTextsAsStrings(): void
    {
        $this->discountLines->method('getVariant')->willReturn('B');

        $labels = (new CheckoutConfigProvider($this->discountLines))->getConfig()['ppDiscountLines']['labels'];

        self::assertSame('Remove coupon %1', $labels['removeCouponNamed']);
        self::assertSame('You save', $labels['youSave']);
        self::assertSame(['coupon', 'removeCoupon', 'removeCouponNamed', 'youSave', 'gift', 'free'], array_keys($labels));
        self::assertContainsOnly('string', $labels);
    }

    public function testNeverExposesRuleDescriptions(): void
    {
        $this->discountLines->method('getVariant')->willReturn('B');

        $encoded = print_r((new CheckoutConfigProvider($this->discountLines))->getConfig(), true);

        self::assertStringNotContainsStringIgnoringCase('description', $encoded);
    }
}
