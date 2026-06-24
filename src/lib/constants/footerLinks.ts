export interface FooterLink {
    label: string;
    href: string;
}

export const helpSupportLinks: FooterLink[] = [
    { label: "Track Order", href: "/track-order" },
    { label: "Returns & Exchanges", href: "/returns-exchanges" },
    { label: "Shipping Info", href: "/shipping-info" },
    { label: "Terms & Conditions", href: "/terms-conditions" },
];

export const customerServiceLinks: FooterLink[] = [
    { label: "Contact Us", href: "/contact-us" },
    { label: "About Us", href: "/about-us" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy Policy", href: "/privacy-policy" },
];

export const contactInfoItems: string[] = [
    "United Kingdom",
    "07832 813934",
    "info@placeoftreasure.co.uk",
];