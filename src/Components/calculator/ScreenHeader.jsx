const ScreenHeader = ({ title, subtitle }) => {
    return (
        <header className="pt-10 sm:pt-12 pb-4 sm:pb-5 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#074BED]">
                {title}
            </h1>
            <p className="mt-3 text-lg text-[#012E58] dark:text-slate-400 max-w-2xl mx-auto">
                {subtitle}
            </p>
        </header>
    );
};

export default ScreenHeader;