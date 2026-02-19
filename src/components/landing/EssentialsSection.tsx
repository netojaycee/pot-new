import Image from "next/image";

export function EssentialsSection() {
  const features = [
    {
      image: "/carbon_delivery.png",
      title: "Fast & Free Shipping",
      description: "Around 24 hours",
    },
    {
      image: "/streamline_discount-percent-fire.png",
      title: "Special Discounts",
      description: "Easy orders",
    },
    {
      image: "/guidance_send.png",
      title: "Buyers’ Protection",
      description: "We have",
    },
    {
      image: "/hugeicons_customer-service.png",
      title: "Customer Service",
      description: "Anytime 24",
    },
  ];

  return (
    <section className="py-4 px-4 lg:px-16 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Image Section */}
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden flex items-start">
          <Image
            src="/feature.png"
            alt="Create something memorable"
            fill
            className="object-cover"
          />
          
        </div>

        {/* Features Section */}
        <div className="space-y-8">
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-2">FEATURED</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Create something memorable
              <br />
              together!
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="space-y-3 flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {feature.title}
                  </p>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
