import React from 'react'


interface CategoryPageProps {
  params: Promise<{ slug: string; type: string }>;
}
// all categories in a type
export default async function AllCategoryByTypePage({ params }: CategoryPageProps) {
  const { type } = await params;  
  return (
    <div>AllCategoryPageByType {type}</div>
  )
}