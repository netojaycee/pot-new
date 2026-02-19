import Image from "next/image";
import Link from "next/link";
import { categoriesSection } from "@/lib/constants";

export function InspirationSection() {
  return (
    <section className="pt-4 pb-10 px-4 lg:px-16 ">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {categoriesSection.heading}
          </h2>
          <p className="text-gray-600">{categoriesSection.subheading}</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesSection.categories.map((category, index) => (
            <div
              key={index}
              className="rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
              style={{ backgroundColor: category.color }}
            >
              <div className="relative w-42.5 h-40 mx-auto">
                <Image
                  src={category.image}
                  alt={category.title}
                  width={170}
                  height={160}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {category.title}
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
