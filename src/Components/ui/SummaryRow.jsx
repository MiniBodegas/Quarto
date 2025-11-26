const SummaryRow = ({
    label,
    value,
    labelClassName = "text-[#012E58]",
    valueClassName = "text-lg font-bold text-[#012E58]",
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
