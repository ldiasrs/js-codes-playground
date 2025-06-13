import moment from 'moment';
// Simple currency normalization - you might want to use a proper currency library like Dinero.js
export const normalizeCurrency = (value) => {
    if (value === undefined || value === null) {
        return 0;
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    // Return a simple object that mimics Dinero.js interface
    return {
        toUnit: () => numValue,
        equals: (other) => {
            const otherValue = typeof other.toUnit === 'function' ? other.toUnit() : Number(other);
            return numValue === otherValue;
        }
    };
};
// Date normalization using moment.js
export const normalizeDate = (dateString) => {
    if (!dateString) {
        return null;
    }
    const momentDate = moment(dateString);
    if (!momentDate.isValid()) {
        return null;
    }
    return momentDate;
};
//# sourceMappingURL=common-helpers.js.map