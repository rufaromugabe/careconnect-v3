"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Plus, Edit, Trash, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getPharmacistProfile, getPharmacyInventory } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export default function InventoryPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pharmacistProfile, setPharmacistProfile] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get pharmacist profile
        const profile = await getPharmacistProfile(user.id)
        setPharmacistProfile(profile)

        if (profile && profile.pharmacy_id) {
          // Get pharmacy inventory
          const inventoryData = await getPharmacyInventory(profile.pharmacy_id)
          setInventory(inventoryData)
        }
      } catch (err: any) {
        console.error("Error loading inventory data:", err)
        setError(err.message || "Failed to load inventory data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddItem = async (newItem) => {
    try {
      if (!pharmacistProfile?.pharmacy_id) {
        toast({
          title: "Error",
          description: "You are not associated with a pharmacy",
          variant: "destructive",
        })
        return
      }

      // Add new inventory item
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          pharmacy_id: pharmacistProfile.pharmacy_id,
          name: newItem.name,
          description: newItem.description,
          quantity: Number.parseInt(newItem.quantity),
          price: Number.parseFloat(newItem.price),
        })
        .select()

      if (error) throw error

      // Update local state
      setInventory([...inventory, data[0]])

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      })
    } catch (err) {
      console.error("Error adding inventory item:", err)
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = async (updatedItem) => {
    try {
      // Update inventory item
      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: updatedItem.name,
          description: updatedItem.description,
          quantity: Number.parseInt(updatedItem.quantity),
          price: Number.parseFloat(updatedItem.price),
        })
        .eq("id", updatedItem.id)

      if (error) throw error

      // Update local state
      setInventory(inventory.map((item) => (item.id === updatedItem.id ? updatedItem : item)))

      setEditingItem(null)

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      })
    } catch (err) {
      console.error("Error updating inventory item:", err)
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      // Delete inventory item
      const { error } = await supabase.from("inventory_items").delete().eq("id", itemId)

      if (error) throw error

      // Update local state
      setInventory(inventory.filter((item) => item.id !== itemId))

      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting inventory item:", err)
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="pharmacist" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="pharmacist" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="pharmacist" />
      <div className="flex-1 flex flex-col">
        <Header
          title="Inventory Management"
          actions={
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <InventoryItemForm onSubmit={handleAddItem} />
              </DialogContent>
            </Dialog>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Card className="mb-8">
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.description || "No description"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <InventoryItemForm item={editingItem} onSubmit={handleEditItem} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InventoryItemForm({ item, onSubmit }) {
  const [formData, setFormData] = useState(
    item || {
      name: "",
      description: "",
      quantity: 0,
      price: 0,
    },
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
        <DialogDescription>
          {item ? "Edit the inventory item's information below." : "Enter the new inventory item's information."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="quantity" className="text-right">
            Quantity
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            className="col-span-3"
            required
            min="0"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="price" className="text-right">
            Price
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            className="col-span-3"
            required
            min="0"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{item ? "Update Item" : "Add Item"}</Button>
      </div>
    </form>
  )
}
