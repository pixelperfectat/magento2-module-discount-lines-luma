/**
 * Pure helpers for the discount lines of a totals object (no dependencies, testable in Node).
 */
define([], function () {
    'use strict';

    /**
     * Amount (float or numeric string) to integer cents, rounded half up on two decimals.
     *
     * @param {*} amount
     * @return {Number}
     */
    function toCents(amount) {
        return Math.round(Number(Number(amount || 0).toFixed(2)) * 100) || 0;
    }

    return {
        toCents: toCents,

        /**
         * Normalise the discount lines of the `discount` total segment.
         *
         * @param {*} segments totals().total_segments
         * @return {Array}
         */
        fromSegments: function (segments) {
            var segment, raw;

            if (!Array.isArray(segments)) {
                return [];
            }
            segment = segments.filter(function (item) {
                return item && item.code === 'discount';
            })[0];
            raw = segment && segment.extension_attributes && segment.extension_attributes.discount_lines;
            if (!Array.isArray(raw)) {
                return [];
            }

            return raw.filter(Boolean).map(function (line) {
                return {
                    kind: String(line.kind || ''),
                    code: line.code ? String(line.code) : '',
                    label: String(line.label || ''),
                    cents: toCents(line.amount),
                    removable: line.kind === 'coupon'
                };
            });
        },

        /**
         * @param {Array} lines normalised lines
         * @return {Number} sum in integer cents
         */
        sumCents: function (lines) {
            return lines.reduce(function (sum, line) {
                return sum + line.cents;
            }, 0);
        }
    };
});
