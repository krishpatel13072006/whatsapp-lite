import React from 'react';


const companies = [
    {
        name: 'NVIDIA',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
            </svg>
        ),
    },
    {
        name: 'Supabase',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424A.396.396 0 0 0 2.52 13h9.48v8.96c0 .313.368.483.606.28l9.08-7.854a.396.396 0 0 0-.324-.67z" />
            </svg>
        ),
    },
    {
        name: 'GitHub',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
        ),
    },
    {
        name: 'OpenAI',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073z" />
            </svg>
        ),
    },
    {
        name: 'TURSO',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
        ),
    },
    {
        name: 'Clerk',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
        ),
    },
    {
        name: 'Claude',
        icon: (
            <span className="company-icon-star">✦</span>
        ),
    },
    {
        name: 'Vercel',
        icon: (
            <svg className="company-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L24 22H0L12 1Z" />
            </svg>
        ),
    },
];

const CompaniesSection = () => {
    return (
        <section className="py-20 px-6 relative">
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <div className="flex justify-center mb-8">
                    <p className="companies-subtitle text-white" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 700 }}>
                        Companies we collaborate with.
                    </p>
                </div>

                <div className="companies-grid-outer">
                    <div className="companies-grid">
                        {companies.map((company, idx) => (
                            <div key={idx} className="company-cell">
                                {company.icon}
                                <span className="company-cell-text">{company.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CompaniesSection;
