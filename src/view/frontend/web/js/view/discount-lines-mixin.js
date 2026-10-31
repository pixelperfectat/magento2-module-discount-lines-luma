/**
 * Renders one totals line per discount in the Luma cart summary and checkout sidebar.
 *
 * Mixin for Magento_SalesRule/js/view/summary/discount and .../cart/totals/discount. The lines are read from
 * totals().total_segments[code=discount].extension_attributes.discount_lines (numbers may be floats or strings,
 * `code` is missing for lines without a code). Without lines, or when the module is disabled, the template falls back
 * to the core title and value.
 */
define([
    'jquery',
    'ko',
    'Magento_SalesRule/js/action/cancel-coupon',
    'mage/url',
    'mage/cookies'
], function ($, ko, cancelCoupon, url) {
    'use strict';

    var config = (window.checkoutConfig || {}).ppDiscountLines || {},
        labels = config.labels || {},
        icons = config.icons || {};

    /**
     * @param {*} segments
     * @return {Array}
     */
    function readLines(segments) {
        var segment, raw;

        if (!Array.isArray(segments)) {
            return [];
        }
        segment = segments.filter(function (item) {
            return item && item.code === 'discount';
        })[0];
        raw = segment && segment['extension_attributes'] && segment['extension_attributes']['discount_lines'];
        if (!Array.isArray(raw)) {
            return [];
        }

        return raw.map(function (line) {
            return {
                kind: String(line.kind || ''),
                code: line.code ? String(line.code) : '',
                label: String(line.label || ''),
                cents: Math.round((Number(line.amount) || 0) * 100),
                removable: line.kind === 'coupon'
            };
        });
    }

    return function (target) {
        var coreTemplate = target.defaults.template;

        return target.extend({
            defaults: {
                template: 'PixelPerfect_DiscountLinesLuma/summary/discount-lines'
            },

            /**
             * @inheritdoc
             */
            initialize: function () {
                this._super();
                this.ppEnabled = config.enabled === true;
                this.ppVariant = String(config.variant || 'B').toUpperCase();
                this.ppBusy = ko.observable(false);
                this.ppLines = ko.pureComputed(function () {
                    var totals = this.totals();

                    return this.ppEnabled && totals ? readLines(totals['total_segments']) : [];
                }, this);
                this.ppVariantClass = 'pp-dl--' + this.ppVariant.toLowerCase();
                if (!this.ppEnabled) {
                    this.template = coreTemplate;
                }

                return this;
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
                if (line.cents > 0) {
                    return this.getFormattedPrice(-line.cents / 100);
                }

                return line.kind === 'free_shipping' ? labels.free : labels.gift;
            },

            /**
             * "You save" in integer cents; only shown with more than one line.
             *
             * @return {String}
             */
            getSavedText: function () {
                var cents = this.ppLines().reduce(function (sum, line) {
                    return sum + line.cents;
                }, 0);

                return this.getFormattedPrice(-cents / 100);
            },

            /**
             * @return {Boolean}
             */
            hasSavedTotal: function () {
                var lines = this.ppLines();

                return lines.length > 1 && lines.some(function (line) {
                    return line.cents > 0;
                });
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
                return icons[kind] || icons['default'] || '';
            },

            /**
             * @param {Object|null} line
             * @return {String}
             */
            getRemoveLabel: function (line) {
                return String(labels.removeCouponNamed || '').replace('%1', line ? line.label : '');
            },

            /**
             * @return {String}
             */
            getCouponText: function () {
                return labels.coupon;
            },

            /**
             * @return {String}
             */
            getRemoveText: function () {
                return labels.removeCoupon;
            },

            /**
             * @return {String}
             */
            getSavedLabel: function () {
                return labels.youSave;
            },

            /**
             * Remove the coupon: through the checkout API in the sidebar (totals update in place), through the
             * cart coupon form on the cart page (the coupon form of that page is rendered by the server).
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

                if (document.body.classList.contains('checkout-cart-index')) {
                    form = $('<form method="post"></form>').attr('action', url.build('checkout/cart/couponPost/'));
                    [['form_key', $.mage.cookies.get('form_key')], ['coupon_code', line.code], ['remove', '1']]
                        .forEach(function (pair) {
                            $('<input type="hidden">').attr('name', pair[0]).val(pair[1] || '').appendTo(form);
                        });
                    form.appendTo(document.body).trigger('submit');

                    return;
                }

                cancelCoupon(ko.observable(true)).always(function () {
                    self.ppBusy(false);
                });
            }
        });
    };
});
