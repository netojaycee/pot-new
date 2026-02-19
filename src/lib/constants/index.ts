



const popularItems = [
    {
        id: "1",
        category_id: "Kitchen",
        name: "Hot Tea Bowl",
        description: "Lorem ipsum Lorem ipsum Lorem",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product3.png", type: "item",
    },
    {
        id: "2",
        category_id: "Kitchen",
        name: "Hot Tea Bowl",
        description: "Lorem ipsum Lorem ipsum Lorem",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product2.png", type: "item",
    },
    {
        id: "3",
        category_id: "Kitchen",
        name: "Hot Tea Bowl",
        description: "Lorem ipsum Lorem ipsum Lorem",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product3.png", type: "item",
    },
    {
        id: "4",
        category_id: "Kitchen",
        name: "Hot Tea Bowl",
        description: "Lorem ipsum Lorem ipsum Lorem",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "item",
    },
];

const bestSellingPackages = [
    {
        id: "5",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "6",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        addedToCart: 40,
        sold: 40,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "7",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "8",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    }, {
        id: "5",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "6",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        addedToCart: 40,
        sold: 40,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "7",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "8",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    }, {
        id: "5",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "6",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        addedToCart: 40,
        sold: 40,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "7",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",
    },
    {
        id: "8",
        category_id: "Snacks",
        name: "Basic Package",
        description:
            "Chocolate, chips, cookies, water, branded pen, crisps, biscuits...",
       avg_rating: 5,
        sold: 100,
        price: 35.0,
        image: "/product1.png", type: "gift",

    },
];

// export interface FoodPackage {
//     id: string;
//     name: string;
//     image: string;
//     category_id: string;
//     description: string;
//     price: number;
//     type: string;
// }

const foodPackages = [
    {
        id: "1",
        name: "Breakfast",
        image: "/breakfast.png",
        category_id: "Breakfast",
        description:
            "For every furry friend and their human! Discover adorable pet-themed keepsakes, and matching owner-pet accessories",
        price: 35.0,
        type: "food",
    },
    {
        id: "2",
        name: "Lunch",
        image: "/lunch.png",
        category_id: "Lunch",
        description: "Lorem ipsum Lorem ipsum Lorem",
        price: 35.0,
        type: "food",
    },
    {
        id: "3",
        name: "Salads",
        image: "/salads.png",
        category_id: "Salads",
        description: "Lorem ipsum Lorem ipsum Lorem",
        price: 35.0,
        type: "food",
    },
    {
        id: "4",
        name: "Pastries & Deserts",
        image: "/pastries.png",
        category_id: "Desserts",
        description: "Lorem ipsum Lorem ipsum Lorem",
        price: 35.0,
        type: "food",
    },
    {
        id: "5",
        name: "Drinks",
        image: "/drinks.png",
        category_id: "Drinks",
        description:
            "For every furry friend and their human! Discover adorable pet-themed keepsakes, and matching owner-pet accessories",
        price: 35.0,
        type: "food",
    },
    {
        id: "6",
        name: "Beverages",
        image: "/salads.png",
        category_id: "Drinks",
        description: "Lorem ipsum Lorem ipsum Lorem",
        price: 35.0,
        type: "food",
    },
];
const testimonial = {
    quote:
        "I’ve found the best presents for kids with PlaceofTreasure! Here you will find a range of unique gift ideas, suitable for kids of all interests",
    reviewerName: "Jamie Emily",
    reviewerRole: "Mom",
    tag: "Best shopping experience! 😊",
    image: "/testimonial.png",
    reviewerAvatar: "/jamie.png",
};

const giftSection = {
    heading: "Find the Perfect Gift for Her",
    description:
        "Because she deserves more than just a present – she deserves a moment of joy. From timeless classics to personalized surprises, discover gifts that speak to her heart. Make her feel cherished with something as special as she is.",
    buttonText: "Shop Now",
    buttonLink: "/shop/for-her",
    image: "/gift.png",
};


const featuresSection = {
    heading: "Create something memorable!",
    features: [
        {
            icon: "/carbon_delivery.png",
            title: "Fast & Free Shipping",
            description: "Around 24 hours",
        },
        {
            icon: "/streamline_discount-percent-fire.png",
            title: "Special Discounts",
            description: "Easy orders",
        },
        {
            icon: "/guidance_send.png",
            title: "Buyers’ Protection",
            description: "We have",
        },
        {
            icon: "/hugeicons_customer-service.png",
            title: "Customer Service",
            description: "Anytime 24",
        },
    ],
    promoText: "Get a 20% discount for $100 order",
    buttonText: "Gift Packages",
    buttonLink: "/gift-packages",
    image: "/feature.png",
};

const categoriesSection = {
    heading: "Need Some Inspiration?",
    subheading:
        "Check out some of our categories and we guarantee you will find the perfect gift",
    categories: [
        {
            title: "Gift for Kids",
            description:
                "Discover playful, colorful, and imaginative gifts that kids will adore! From cuddly toys to creative DIY kits",
            image: "/categories1.png",
            color: "#F2F3FD"
        },
        {
            title: "Anniversary Gifts",
            description:
                "Every anniversary marks another chapter in a beautiful story. Our hand-picked collection helps you express happiness fully",
            image: "/categories2.png",
            color: "#F1F8F0"

        },
        {
            title: "Corporate Gifts",
            description:
                "Impress clients and reward your team with premium, branded gifts! to make a lasting impact",
            image: "/categories3.png",
            color: "#F5F4F4"

        },
        {
            title: "Pet Lover Gifts",
            description:
                "For every furry friend and their human! Discover adorable pet-themed keepsakes, and matching owner-pet accessories",
            image: "/categories4.png",
            color: "#FCFAF3"

        },
    ],
};
const banner1 = [
    {
        id: "1",
        image: "/banner1_1.png"
    }
    , {
        id: "1",
        image: "/banner1_2.png"
    }
]

const banner2 = [
    {
        id: "1",
        title: "Same- Day & Scheduled Delivery",
        description: "Need it today ? No problem.Choose instant delivery or schedule ahead—we’ll handle the rest.",
        image: "/lettering fast delivery in the rocket with clouds and stars text.png"
    },
    {
        id: "2",
        title: "Customizable Gift Options",
        description: "Add handwritten notes, special packaging, or build your own gift box.The best gifts come from the heart",
        image: "/christmas gifts.png"
    }
]

export {
    popularItems,
    bestSellingPackages,
    testimonial,
    giftSection,
    featuresSection,
    categoriesSection,
    foodPackages,
    banner1,
    banner2
};