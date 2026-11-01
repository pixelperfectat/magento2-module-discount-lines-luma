var config = {
    config: {
        mixins: {
            'Magento_SalesRule/js/view/summary/discount': {
                'PixelPerfect_DiscountLinesLuma/js/view/discount-lines-mixin': true
            },
            'Magento_SalesRule/js/view/cart/totals/discount': {
                'PixelPerfect_DiscountLinesLuma/js/view/cart-mixin': true
            }
        }
    }
};
