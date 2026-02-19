"use client";
import Image from "next/image";
import React from "react";

const LoaderComponent = () => {
  return (
    // <div className='fixed inset-0 backdrop-blur-[2px] bg-gradient-to-b from-black to-transparent flex items-center justify-center z-50'>
    <div className='fixed inset-0 backdrop-blur-[3px] flex items-center justify-center z-50'>
      <Image
        src='/loader.gif'
        alt='loader'
        width={200}
        height={200}
        className='object-cover'
        unoptimized={true}
      />
      <div className='absolute inset-0 bg-black/40'></div>
      {/* semi circle white circling */}
      {/* <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-white'></div> */}
    </div>
  );
};

export default LoaderComponent;
