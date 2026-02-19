import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className='flex-1 relative'>
      <Input
        className='pr-10 w-full font-normal placeholder:text-muted-foreground text-sm'
        placeholder='Search breakfast,items, gift boxes...'
      />
      <Search className='absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
    </div>
  );
}
