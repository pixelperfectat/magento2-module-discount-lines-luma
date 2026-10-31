/**
 * Cart page variant of the discount lines: the cart totals component only swaps the template and removes the coupon
 * through the cart coupon form (see discount-lines-mixin.js for the rest).
 */
define([], function () {
    'use strict';

    return function (target) {
        var coreTemplate = target.defaults.template;

        return target.extend({
            defaults: {
                template: 'PixelPerfect_DiscountLinesLuma/summary/discount-lines',
                ppIsCart: true
            },

            /**
             * @inheritdoc
             */
            initialize: function () {
                this._super();
                if (!this.ppEnabled) {
                    this.template = coreTemplate;
                }

                return this;
            }
        });
    };
});
