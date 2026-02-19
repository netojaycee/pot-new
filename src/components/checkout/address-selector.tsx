"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import type { Address } from "@/lib/hooks/use-checkout";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onAddNewClick: () => void;
  isAddingNew: boolean;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onAddNewClick,
  isAddingNew,
}: AddressSelectorProps) {
  const { watch, setValue } = useFormContext();
  const useExistingAddress = watch("useExistingAddress");

  const handleSelectAddress = (addressId: string) => {
    setValue("useExistingAddress", true);
    setValue("existingAddressId", addressId);
  };

  const handleAddNew = () => {
    setValue("useExistingAddress", false);
    setValue("existingAddressId", undefined);
    onAddNewClick();
  };

  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={`p-4 cursor-pointer transition-colors ${
              useExistingAddress && selectedAddressId === address.id
                ? "border-teal-500 bg-teal-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleSelectAddress(address.id)}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="address-select"
                value={address.id}
                checked={useExistingAddress && selectedAddressId === address.id}
                onChange={() => handleSelectAddress(address.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {address.street}
                </p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-sm text-gray-600">{address.country}</p>
                {address.isDefault && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add New Address Option */}
      <div className="border-t pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleAddNew}
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>
    </div>
  );
}
