import React from 'react';

const SummaryRow = ({
    label,
    value,
    labelClassName = "text-muted-foreground dark:text-muted-dark-foreground",
    valueClassName = "text-lg font-bold dark:text-slate-100",
    className = ""
}) => {
    return (
        <div className={`flex justify-between items-center p-4 bg-muted dark:bg-muted-dark rounded-xl border border-border dark:border-border-dark ${className}`}>
            <span className={labelClassName}>{label}</span>
            <span className={valueClassName}>{value}</span>
        </div>
    );
};

export default SummaryRow;
