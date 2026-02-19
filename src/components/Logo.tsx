import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Logo() {
  return (
    <Link href='/' className='flex items-center space-x-2'>
      <Image
        src={"/logo.png"}
        alt='Logo'
        width={67}
        height={73}
        className='object-cover hidden md:block'
        quality={75}
      />

      <Image
        src={"/logo.png"}
        alt='Logo'
        width={40}
        height={45}
        className='object-cover md:hidden'
        quality={75}
      />
    </Link>
  );
}
