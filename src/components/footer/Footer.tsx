import MobileFooter from "./MobileFooter";
import DesktopFooter from "./DesktopFooter";

export default function Footer() {
  return (
    <>
      {/* Show MobileFooter on mobile (hidden on md and above) */}
      <div className='md:hidden'>
        <MobileFooter />
      </div>
      {/* Show DesktopFooter on desktop (hidden on mobile) */}
      <div className='hidden md:block'>
        <DesktopFooter />
      </div>
    </>
  );
}
