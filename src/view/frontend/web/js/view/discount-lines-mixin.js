/**
 * Renders one totals line per discount in the Luma checkout sidebar (and, through cart-mixin.js, the cart page).
 *
 * Mixin for Magento_SalesRule/js/view/summary/discount. The lines are read from
 * totals().total_segments[code=discount].extension_attributes.discount_lines. Without lines, or when the module is
 * disabled, the template falls back to the core markup and gating.
 */
define([
    'jquery',
    'ko',
    'Magento_SalesRule/js/action/cancel-coupon',
    'Magento_SalesRule/js/model/coupon',
    'mage/url',
    'PixelPerfect_DiscountLinesLuma/js/model/lines',
    'mage/cookies'
], function ($, ko, cancelCoupon, couponModel, url, linesModel) {
    'use strict';

    return function (target) {
        var coreTemplate = target.defaults.template;

        if (target.defaults.ppMixin) {
            return target;
        }

        return target.extend({
            defaults: {
                template: 'PixelPerfect_DiscountLinesLuma/summary/discount-lines',
                ppMixin: true,
                ppIsCart: false
            },

            /**
             * @inheritdoc
             */
            initialize: function () {
                var self = this;

                this._super();
                this.ppConfig = (window.checkoutConfig || {}).ppDiscountLines || {};
                this.ppEnabled = this.ppConfig.enabled === true;
                this.ppVariant = String(this.ppConfig.variant || 'B').toUpperCase();
                this.ppVariantClass = 'pp-dl--' + this.ppVariant.toLowerCase();
                this.ppBusy = ko.observable(false);
                this.ppLines = ko.pureComputed(function () {
                    var totals = this.totals();

                    return this.ppEnabled && totals ? linesModel.fromSegments(totals['total_segments']) : [];
                }, this);
                if (!this.ppEnabled) {
                    this.template = coreTemplate;
                }
                // The coupon is gone and the totals are reloaded: the chip can be used again.
                cancelCoupon.registerSuccessCallback(function () {
                    self.ppBusy(false);
                });

                return this;
            },

            /**
             * Lines are shown whenever there are some (a gift or free shipping line has amount 0); without lines the
             * core gating applies. The checkout sidebar waits for the shipping step like core does.
             *
             * @return {Boolean}
             */
            isVisible: function () {
                if (this.hasLines()) {
                    return this.ppIsCart || this.isFullMode();
                }

                return this.isDisplayed();
            },

            /**
             * @return {Boolean}
             */
            hasLines: function () {
                return this.ppLines().length > 0;
            },

            /**
             * @return {Array}
             */
            getLines: function () {
                return this.ppLines();
            },

            /**
             * @param {Object} line
             * @return {String}
             */
            getLineAmount: function (line) {
                var labels = this.ppConfig.labels || {};

                if (line.cents > 0) {
                    return this.getFormattedPrice(-line.cents / 100);
                }
                if (line.kind === 'gift') {
                    return labels.gift;
                }
                if (line.kind === 'free_shipping') {
                    return labels.free;
                }

                return this.getFormattedPrice(0);
            },

            /**
             * "You save" in integer cents.
             *
             * @return {String}
             */
            getSavedText: function () {
                return this.getFormattedPrice(-linesModel.sumCents(this.ppLines()) / 100);
            },

            /**
             * Only with more than one line and a real saving.
             *
             * @return {Boolean}
             */
            hasSavedTotal: function () {
                return this.ppLines().length > 1 && linesModel.sumCents(this.ppLines()) > 0;
            },

            /**
             * @return {Object|null}
             */
            getFirstCoupon: function () {
                return this.ppLines().filter(function (line) {
                    return line.removable;
                })[0] || null;
            },

            /**
             * @param {String} kind
             * @return {String}
             */
            getIconUrl: function (kind) {
                var icons = this.ppConfig.icons || {};

                return icons[kind] || icons['default'] || '';
            },

            /**
             * @param {Object|null} line
             * @return {String}
             */
            getRemoveLabel: function (line) {
                return String((this.ppConfig.labels || {}).removeCouponNamed || '')
                    .replace('%1', line ? line.label : '');
            },

            /**
             * @return {String}
             */
            getCouponText: function () {
                return (this.ppConfig.labels || {}).coupon;
            },

            /**
             * @return {String}
             */
            getRemoveText: function () {
                return (this.ppConfig.labels || {}).removeCoupon;
            },

            /**
             * @return {String}
             */
            getSavedLabel: function () {
                return (this.ppConfig.labels || {}).youSave;
            },

            /**
             * Remove the coupon: through the checkout API in the sidebar (totals update in place and the coupon
             * form of the payment step is reset through the shared coupon model), through the cart coupon form on
             * the cart page (that page renders its coupon form on the server).
             *
             * @param {Object|null} line
             */
            removeCoupon: function (line) {
                var self = this,
                    form;

                if (!line || !line.removable || this.ppBusy()) {
                    return;
                }
                this.ppBusy(true);

                if (this.ppIsCart) {
                    form = $('<form method="post"></form>').attr('action', url.build('checkout/cart/couponPost/'));
                    [['form_key', $.mage.cookies.get('form_key')], ['coupon_code', line.code], ['remove', '1']]
                        .forEach(function (pair) {
                            $('<input type="hidden">').attr('name', pair[0]).val(pair[1] || '').appendTo(form);
                        });
                    form.appendTo(document.body).trigger('submit');

                    return;
                }

                cancelCoupon(couponModel.getIsApplied()).fail(function () {
                    self.ppBusy(false);
                });
            }
        });
    };
});
