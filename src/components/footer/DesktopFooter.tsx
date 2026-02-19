"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronRight,
} from "lucide-react";
import {
  contactInfoItems,
  customerServiceLinks,
  helpSupportLinks,
} from "@/lib/constants/footerLinks";
import Logo from "../Logo";

export default function DesktopFooter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-black text-white">
      {/* Top Section */}
      <div className=" px-4 md:px-16 py-8">
        <div className="grid grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div>
            <Logo />
            <p className="text-sm text-gray-400 mt-4">
              Thoughtfully curated gifts for every occasion, priced fairly and
              delivered reliably across the UK.
            </p>
          </div>
          {/* Help & Support */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Help & Support
            </h3>
            <ul className="space-y-2">
              {helpSupportLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2">
              {customerServiceLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-semibold uppercase mb-4">
              Contact Info
            </h3>
            <ul className="space-y-2">
              {contactInfoItems.map((item, index) => (
                <li key={index} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-4 md:px-16 py-4">
        <div className="flex items-center justify-between">
          {/* Newsletter */}
          <div className="max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">
              Subscribe to our newsletter & get 10% discount
            </h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 text-white border-gray-600 flex-1"
                required
              />
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 px-4"
              >
                Submit
              </Button>
            </form>
          </div>

          {/* Follow Us */}
          <div className="">
            <p className="text-sm font-semibold mb-3">FOLLOW US:</p>
            <div className="flex gap-3 justify-end">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6 hover:text-primary transition-colors" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold mb-3">Secure shopping</p>
            <div className="flex flex-wrap gap-2">
              <Image
                src="/visa.png"
                alt="Visa"
                width={48}
                height={30}
                className="bg-white rounded p-1"
              />
              <Image
                src="/amazon.png"
                alt="Amazon pay"
                width={48}
                height={30}
                className="bg-white rounded p-1"
              />
              <Image
                src="/paypal.png"
                alt="PayPal"
                width={48}
                height={30}
                className="bg-white rounded p-1"
              />
              <Image
                src="/mastercard.png"
                alt="Mastercard"
                width={48}
                height={30}
                className="bg-white rounded p-1"
              />
            </div>
          </div>
          {/* Copyright */}
          <div className="">
            <div className="container mx-auto px-4 py-4 text-center">
              <p className="text-xs text-gray-500">
                Copyright © 2025 Place of Treasure | All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
