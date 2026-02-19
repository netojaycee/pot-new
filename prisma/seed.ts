// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '@prisma/generated/client';
// import { createId as cuid } from "@paralleldrive/cuid2";

// const adapter = new PrismaPg({
//   connectionString: "postgres://22f5514c05e08d0701c78672184233c1a0978b0d7c56087892e076d924fdaf02:sk_g-KCP1KOKnjGfd_R8vUO2@db.prisma.io:5432/postgres?sslmode=require",
// });

// const prisma = new PrismaClient({
//   adapter,
// });

// async function main() {
//   console.log("Start seeding ...");

//   // Categories
//   const electronicsId = cuid();
//   const clothingId = cuid();

//   const electronics = await prisma.category.upsert({
//     where: { id: electronicsId },
//     update: {}, // Don't update if exists
//     create: {
//       id: electronicsId,
//       name: 'Electronics',
//       description: 'Latest gadgets and devices',
//     },
//   });

//   const clothing = await prisma.category.upsert({
//     where: { id: clothingId },
//     update: {},
//     create: {
//       id: clothingId,
//       name: 'Clothing',
//       description: 'Fashionable apparel',
//     },
//   });

//   // Products
//   const phone = await prisma.product.upsert({
//     where: { id: cuid() },
//     update: {},
//     create: {
//       id: cuid(),
//       name: 'Phone X1',
//       description: 'A powerful smartphone with an amazing camera.',
//       price: 999.99,
//       availableQuantity: 50,
//       categoryId: electronics.id,
//       images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop'],
//     },
//   });

//   const laptop = await prisma.product.upsert({
//     where: { id: cuid() },
//     update: {},
//     create: {
//       id: cuid(),
//       name: 'Laptop Pro',
//       description: 'High performance laptop for professionals.',
//       price: 1999.0,
//       availableQuantity: 20,
//       categoryId: electronics.id,
//       images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop'],
//     },
//   });

//   const tshirt = await prisma.product.upsert({
//     where: { id: cuid() },
//     update: {},
//     create: {
//       id: cuid(),
//       name: 'Classic T-Shirt',
//       description: '100% Cotton, comfortable and durable.',
//       price: 29.99,
//       availableQuantity: 100,
//       categoryId: clothing.id,
//       images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'],
//     },
//   });

//   console.log({ electronics, clothing, phone, laptop, tshirt });
//   console.log("Seeding finished.");
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });




import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/generated/client";
import { createId as cuid } from "@paralleldrive/cuid2";
import { generateSlug } from "@/lib/utils";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

// Image URLs - will alternate between these
const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
];

// Helper to create image object with url and pubId
function createImageObject(url: string, index: number) {
  return {
    url,
    pubId: `unsplash_${index}_${Date.now()}`,
  };
}



// Helper to get alternating images
function getImages(startIndex: number = 0) {
  const images: any[] = [];
  for (let i = 0; i < 2; i++) {
    const imageIndex = (startIndex + i) % IMAGE_URLS.length;
    images.push(createImageObject(IMAGE_URLS[imageIndex], imageIndex));
  }
  return images;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  try {
    // ============ CATEGORIES ============
    console.log("📁 Creating categories...");

    // ITEM Category with subcategories
    const itemCategory = await prisma.category.upsert({
      where: { slug: generateSlug("Items") },
      update: {},
      create: {
        id: cuid(),
        name: "Items",
        description: "Quality everyday items and essentials",
        slug: generateSlug("Items"),
        type: "item",
      },
    });

    const electronicsSubcat = await prisma.category.upsert({
      where: { slug: generateSlug("Electronics") },
      update: {},
      create: {
        id: cuid(),
        name: "Electronics",
        description: "Latest gadgets and electronics",
        slug: generateSlug("Electronics"),
        type: "item",
        parentId: itemCategory.id,
      },
    });

    const accessoriesSubcat = await prisma.category.upsert({
      where: { slug: generateSlug("Accessories") },
      update: {},
      create: {
        id: cuid(),
        name: "Accessories",
        description: "Fashion and tech accessories",
        slug: generateSlug("Accessories"),
        type: "item",
        parentId: itemCategory.id,
      },
    });

    // FOOD Category with subcategories
    const foodCategory = await prisma.category.upsert({
      where: { slug: generateSlug("Food & Beverages") },
      update: {},
      create: {
        id: cuid(),
        name: "Food & Beverages",
        description: "Premium food and beverage selections",
        slug: generateSlug("Food & Beverages"),
        type: "food",
      },
    });

    const snacksSubcat = await prisma.category.upsert({
      where: { slug: generateSlug("Snacks") },
      update: {},
      create: {
        id: cuid(),
        name: "Snacks",
        description: "Delicious snacks and treats",
        slug: generateSlug("Snacks"),
        type: "food",
        parentId: foodCategory.id,
      },
    });

    const beveragesSubcat = await prisma.category.upsert({
      where: { slug: generateSlug("Beverages") },
      update: {},
      create: {
        id: cuid(),
        name: "Beverages",
        description: "Coffee, tea, and drinks",
        slug: generateSlug("Beverages"),
        type: "food",
        parentId: foodCategory.id,
      },
    });

    // GIFTBOX Category
    const giftboxCategory = await prisma.category.upsert({
      where: { slug: generateSlug("Gift Boxes") },
      update: {},
      create: {
        id: cuid(),
        name: "Gift Boxes",
        description: "Curated gift boxes for every occasion",
        slug: generateSlug("Gift Boxes"),
        type: "giftbox",
      },
    });

    const premiumGiftSubcat = await prisma.category.upsert({
      where: { slug: generateSlug("Premium Gifts") },
      update: {},
      create: {
        id: cuid(),
        name: "Premium Gifts",
        description: "Luxury gift box collections",
        slug: generateSlug("Premium Gifts"),
        type: "giftbox",
        parentId: giftboxCategory.id,
      },
    });

    // Additional giftbox categories
    const giftsForHim = await prisma.category.upsert({
      where: { slug: generateSlug("Gifts for him") },
      update: {},
      create: {
        id: cuid(),
        name: "Gifts for him",
        description: "Curated gifts specially selected for the men in your life",
        slug: generateSlug("Gifts for him"),
        type: "giftbox",
      },
    });

    const giftsForHer = await prisma.category.upsert({
      where: { slug: generateSlug("Gifts for her") },
      update: {},
      create: {
        id: cuid(),
        name: "Gifts for her",
        description: "Thoughtfully chosen gifts perfect for the special women in your life",
        slug: generateSlug("Gifts for her"),
        type: "giftbox",
      },
    });

    const weddingAnniversary = await prisma.category.upsert({
      where: { slug: generateSlug("Wedding anniversary") },
      update: {},
      create: {
        id: cuid(),
        name: "Wedding anniversary",
        description: "Celebrate love and commitment with the perfect anniversary gift",
        slug: generateSlug("Wedding anniversary"),
        type: "giftbox",
      },
    });

    const birthdayGifts = await prisma.category.upsert({
      where: { slug: generateSlug("Birthday gifts") },
      update: {},
      create: {
        id: cuid(),
        name: "Birthday gifts",
        description: "Make every birthday special with our curated gift packages",
        slug: generateSlug("Birthday gifts"),
        type: "giftbox",
      },
    });

    const specialSale = await prisma.category.upsert({
      where: { slug: generateSlug("Special sale") },
      update: {},
      create: {
        id: cuid(),
        name: "Special sale",
        description: "Exclusive deals and limited-time offers on premium gifts",
        slug: generateSlug("Special sale"),
        type: "giftbox",
      },
    });

    const customizeGift = await prisma.category.upsert({
      where: { slug: generateSlug("Customize a gift") },
      update: {},
      create: {
        id: cuid(),
        name: "Customize a gift",
        description: "Create your own personalized gift package tailored to perfection",
        slug: generateSlug("Customize a gift"),
        type: "giftbox",
      },
    });

    const giftForPets = await prisma.category.upsert({
      where: { slug: generateSlug("Gift for pets") },
      update: {},
      create: {
        id: cuid(),
        name: "Gift for pets",
        description: "Delight your furry friends with our pet-friendly gift selections",
        slug: generateSlug("Gift for pets"),
        type: "giftbox",
      },
    });

    const burialGift = await prisma.category.upsert({
      where: { slug: generateSlug("Burial gift") },
      update: {},
      create: {
        id: cuid(),
        name: "Burial gift",
        description: "Thoughtful and respectful gifts to honor and remember loved ones",
        slug: generateSlug("Burial gift"),
        type: "giftbox",
      },
    });

    console.log("✅ Categories created\n");

    // ============ ITEMS (Electronics & Accessories) ============
    console.log("🛍️ Creating item products...");

    let imageIndex = 0;

    // Electronics products
    const electronicsProducts = [
      {
        name: "Wireless Headphones Pro",
        description:
          "Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
        price: 199.99,
        slug: generateSlug("Wireless Headphones Pro"),
        categoryId: electronicsSubcat.id,
        tags: ["audio", "wireless", "headphones"],
      },
      {
        name: "Smart Watch Ultra",
        description:
          "Advanced smartwatch with health tracking, fitness modes, and seamless smartphone integration.",
        price: 299.99,
        slug: generateSlug("Smart Watch Ultra"),
        categoryId: electronicsSubcat.id,
        tags: ["wearable", "smartwatch", "fitness"],
      },
      {
        name: "USB-C Fast Charger",
        description:
          "High-speed USB-C charger compatible with all devices. Compact design perfect for travel.",
        price: 49.99,
        slug: generateSlug("USB-C Fast Charger"),
        categoryId: electronicsSubcat.id,
        tags: ["charger", "tech", "travel"],
      },
      {
        name: "Portable Power Bank",
        description:
          "20000mAh power bank with fast charging. Keep your devices powered on the go.",
        price: 79.99,
        slug: generateSlug("Portable Power Bank"),
        categoryId: electronicsSubcat.id,
        tags: ["power", "portable", "battery"],
      },
    ];

    for (const product of electronicsProducts) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          images: getImages(imageIndex) as any,
          availableQuantity: Math.floor(Math.random() * 100) + 20,
          discountPercentage: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : null,
        },
      });
      imageIndex++;
    }

    // Accessories products
    const accessoriesProducts = [
      {
        name: "Premium Phone Case",
        description:
          "Durable and stylish phone case with shock protection and premium materials.",
        price: 29.99,
        slug: generateSlug("Premium Phone Case"),
        categoryId: accessoriesSubcat.id,
        tags: ["phone", "case", "protection"],
      },
      {
        name: "Designer Sunglasses",
        description:
          "Fashionable UV-protective sunglasses with premium lens quality. Perfect for any season.",
        price: 149.99,
        slug: generateSlug("Designer Sunglasses"),
        categoryId: accessoriesSubcat.id,
        tags: ["sunglasses", "fashion", "uv"],
      },
      {
        name: "Leather Wallet",
        description: "Genuine leather wallet with RFID protection. Classic and functional design.",
        price: 59.99,
        slug: generateSlug("Leather Wallet"),
        categoryId: accessoriesSubcat.id,
        tags: ["wallet", "leather", "rfid"],
      },
      {
        name: "Screen Protector Set",
        description: "Pack of tempered glass screen protectors with installation kit.",
        price: 19.99,
        slug: generateSlug("Screen Protector Set"),
        categoryId: accessoriesSubcat.id,
        tags: ["screen", "protection", "glass"],
      },
    ];

    for (const product of accessoriesProducts) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          images: getImages(imageIndex) as any,
          availableQuantity: Math.floor(Math.random() * 150) + 30,
          discountPercentage: Math.random() > 0.6 ? Math.floor(Math.random() * 25) + 5 : null,
        },
      });
      imageIndex++;
    }

    console.log("✅ Item products created\n");

    // ============ FOOD PRODUCTS ============
    console.log("🍫 Creating food products...");

    // Snacks products
    const snacksProducts = [
      {
        name: "Organic Almonds",
        description:
          "Premium organic almonds, roasted and lightly salted. Rich in healthy fats and nutrients.",
        price: 24.99,
        slug: generateSlug("Organic Almonds"),
        categoryId: snacksSubcat.id,
        tags: ["nuts", "organic", "healthy"],
      },
      {
        name: "Chocolate Truffles Box",
        description:
          "Handcrafted chocolate truffles with various flavors. Perfect for chocolate lovers.",
        price: 34.99,
        slug: generateSlug("Chocolate Truffles Box"),
        categoryId: snacksSubcat.id,
        tags: ["chocolate", "treats", "gourmet"],
      },
      {
        name: "Mixed Dried Fruits",
        description: "Assorted dried fruits including mango, cranberry, and apricot.",
        price: 19.99,
        slug: generateSlug("Mixed Dried Fruits"),
        categoryId: snacksSubcat.id,
        tags: ["fruits", "dried", "healthy"],
      },
      {
        name: "Granola Clusters",
        description:
          "Crunchy granola clusters with honey and almonds. Great for breakfast or snacking.",
        price: 14.99,
        slug: generateSlug("Granola Clusters"),
        categoryId: snacksSubcat.id,
        tags: ["granola", "breakfast", "snack"],
      },
    ];

    for (const product of snacksProducts) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          images: getImages(imageIndex) as any,
          availableQuantity: Math.floor(Math.random() * 200) + 50,
          discountPercentage: Math.random() > 0.5 ? Math.floor(Math.random() * 35) + 10 : null,
        },
      });
      imageIndex++;
    }

    // Beverages products
    const beveragesProducts = [
      {
        name: "Premium Coffee Beans",
        description:
          "Single-origin arabica coffee beans with rich flavor profile. Freshly roasted.",
        price: 19.99,
        slug: generateSlug("Premium Coffee Beans"),
        categoryId: beveragesSubcat.id,
        tags: ["coffee", "premium", "organic"],
      },
      {
        name: "Green Tea Collection",
        description: "Assorted premium green teas from various regions with antioxidants.",
        price: 29.99,
        slug: generateSlug("Green Tea Collection"),
        categoryId: beveragesSubcat.id,
        tags: ["tea", "green", "health"],
      },
      {
        name: "Hot Chocolate Mix",
        description:
          "Premium hot chocolate mix with real cocoa. Perfect for cozy winter drinks.",
        price: 12.99,
        slug: generateSlug("Hot Chocolate Mix"),
        categoryId: beveragesSubcat.id,
        tags: ["chocolate", "cocoa", "beverage"],
      },
      {
        name: "Herbal Tea Pack",
        description:
          "Relaxing blend of herbal teas with chamomile, mint, and other natural herbs.",
        price: 16.99,
        slug: generateSlug("Herbal Tea Pack"),
        categoryId: beveragesSubcat.id,
        tags: ["herbal", "tea", "relaxing"],
      },
    ];

    for (const product of beveragesProducts) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          images: getImages(imageIndex) as any,
          availableQuantity: Math.floor(Math.random() * 150) + 40,
          discountPercentage: Math.random() > 0.55 ? Math.floor(Math.random() * 20) + 5 : null,
        },
      });
      imageIndex++;
    }

    console.log("✅ Food products created\n");

    // ============ GIFTBOX PRODUCTS ============
    console.log("🎁 Creating gift box products...");

    // First create individual items that will be components in gift boxes
    const giftComponentProducts = [
      {
        name: "Luxury Coffee Selection",
        description: "Premium coffee beans collection",
        price: 35.0,
        slug: generateSlug("Luxury Coffee Selection"),
        categoryId: foodCategory.id,
        images: getImages(imageIndex++),
        availableQuantity: 100,
      },
      {
        name: "Artisan Chocolate",
        description: "Handcrafted artisan chocolate",
        price: 25.0,
        slug: generateSlug("Artisan Chocolate"),
        categoryId: foodCategory.id,
        images: getImages(imageIndex++),
        availableQuantity: 150,
      },
      {
        name: "Premium Tea Selection",
        description: "Curated tea collection",
        price: 28.0,
        slug: generateSlug("Premium Tea Selection"),
        categoryId: foodCategory.id,
        images: getImages(imageIndex++),
        availableQuantity: 120,
      },
    ];

    const giftComponents = [];
    for (const product of giftComponentProducts) {
      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          images: product.images as any,
        },
      });
      giftComponents.push(created);
    }

    // Gift box products
    const giftboxProducts = [
      {
        name: "Deluxe Coffee & Tea Gift Box",
        description:
          "A perfect blend of premium coffee and tea. Ideal for coffee and tea enthusiasts.",
        price: 89.99,
        slug: generateSlug("Deluxe Coffee & Tea Gift Box"),
        categoryId: premiumGiftSubcat.id,
      },
      {
        name: "Chocolate Lover's Delight",
        description:
          "Assorted premium chocolates with artisan flavors. Perfect for any occasion.",
        price: 79.99,
        slug: generateSlug("Chocolate Lover's Delight"),
        categoryId: premiumGiftSubcat.id,
      },
      {
        name: "Ultimate Gourmet Gift Set",
        description:
          "Luxury collection featuring coffee, tea, and chocolate. The ultimate gift.",
        price: 129.99,
        slug: generateSlug("Ultimate Gourmet Gift Set"),
        categoryId: premiumGiftSubcat.id,
      },
    ];

    for (const product of giftboxProducts) {
      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          id: cuid(),
          ...product,
          type: "giftbox",
          images: getImages(imageIndex) as any,
          availableQuantity: Math.floor(Math.random() * 50) + 10,
          discountPercentage:
            Math.random() > 0.6 ? Math.floor(Math.random() * 15) + 5 : null,
        },
      });

      // Link components to gift box
      for (let i = 0; i < giftComponents.length; i++) {
        await prisma.giftBoxItem.create({
          data: {
            id: cuid(),
            giftBoxId: created.id,
            productId: giftComponents[i].id,
            quantity: Math.floor(Math.random() * 3) + 1,
          },
        });
      }

      imageIndex++;
    }

    console.log("✅ Gift box products created\n");

    console.log(
      "🎉 Database seeding completed successfully!\n"
    );
    console.log("Summary:");
    console.log("  ✓ 3 main categories created");
    console.log("  ✓ 5 subcategories created");
    console.log("  ✓ 8 item products created");
    console.log("  ✓ 8 food products created");
    console.log("  ✓ 3 gift box products created");
    console.log("  ✓ All products with alternating Unsplash images");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });