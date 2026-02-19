import React from 'react'


interface CategoryPageProps {
  params: Promise<{ slug: string; type: string }>;
}
// all products in a category in a type
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, type } = await params;  
  return (
    <div>CategoryPage</div>
  )
}
