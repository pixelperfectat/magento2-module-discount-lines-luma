<?php

declare(strict_types=1);

namespace PixelPerfect\DiscountLinesLuma\Service;

use Magento\Checkout\Model\ConfigProviderInterface;
use PixelPerfect\DiscountLines\Api\Data\DiscountLineInterface;
use PixelPerfect\DiscountLines\ViewModel\DiscountLines;

/**
 * Hands the display settings of the discount lines (variant, icons, translated texts) to the Luma checkout and
 * cart page JavaScript through `window.checkoutConfig.ppDiscountLines`. No business logic.
 */
class CheckoutConfigProvider implements ConfigProviderInterface
{
    /**
     * @param DiscountLines $discountLines
     * @param string[] $kinds line kinds an icon URL is provided for
     */
    public function __construct(
        private readonly DiscountLines $discountLines,
        private readonly array $kinds = [
            DiscountLineInterface::KIND_COUPON,
            DiscountLineInterface::KIND_AUTOMATIC,
            DiscountLineInterface::KIND_GIFT,
            DiscountLineInterface::KIND_FREE_SHIPPING,
            DiscountLineInterface::KIND_GIFT_CARD,
        ]
    ) {
    }

    /**
     * Get the discount lines settings for the checkout configuration.
     *
     * @return array<string, mixed>
     */
    public function getConfig(): array
    {
        $icons = ['default' => $this->discountLines->getIconUrl('')];
        foreach ($this->kinds as $kind) {
            $icons[$kind] = $this->discountLines->getIconUrl($kind);
        }

        return [
            'ppDiscountLines' => [
                'enabled' => $this->discountLines->isEnabled(),
                'variant' => strtoupper($this->discountLines->getVariant()),
                'icons' => $icons,
                'labels' => [
                    'coupon' => (string)__('Coupon'),
                    'removeCoupon' => (string)__('Remove coupon'),
                    'removeCouponNamed' => (string)__('Remove coupon %1'),
                    'youSave' => (string)__('You save'),
                    'gift' => (string)__('Gift'),
                    'free' => (string)__('Free'),
                ],
            ],
        ];
    }
}
