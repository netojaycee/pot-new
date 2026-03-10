"use client";

import { useState } from "react";
import { MapPin, Edit2, Trash2, Plus, Check } from "lucide-react";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function DeliveryAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      label: "Dawson Street",
      street: "14 Dawson Street",
      city: "Manchester",
      state: "MN",
      zip: "M4N SHN",
      country: "United Kingdom",
      isDefault: true,
    },
    {
      id: "2",
      label: "Home",
      street: "14 Dawson Street",
      city: "Manchester",
      state: "MN",
      zip: "M4N SHN",
      country: "United Kingdom",
      isDefault: false,
    },
    {
      id: "3",
      label: "Office",
      street: "14 Dawson Street",
      city: "Manchester",
      state: "MN",
      zip: "M4N SHN",
      country: "United Kingdom",
      isDefault: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const handleAddNew = () => {
    setFormData({ label: "", street: "", city: "", state: "", zip: "", country: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingId) {
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingId ? { ...addr, ...formData } : addr
        )
      );
    } else {
      setAddresses([
        ...addresses,
        {
          id: Date.now().toString(),
          ...formData,
          isDefault: false,
        },
      ]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Addresses
          </h2>
          <p className="text-gray-600 mt-1">
            View and manage your saved delivery locations
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Address</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>

          <div className="space-y-4">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address label (e.g., Home, Office)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter address label"
              />
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street address
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter street address"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="State/Province"
                />
              </div>
            </div>

            {/* ZIP & Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 transition"
            >
              Save Address
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Addresses List */}
      {!showForm && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 md:p-6 border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                {/* Icon & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900">
                      {address.label}
                    </h3>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1 ml-auto">
                        <Check className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {address.street}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.zip},{" "}
                    {address.country}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-200" />
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Mobile Menu */}
                  <div className="lg:hidden">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
                      ⋮
                    </button>
                  </div>
                </div>
              </div>

              {/* Set Default Button */}
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
