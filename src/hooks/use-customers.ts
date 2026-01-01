import { useLocalStorage } from './use-local-storage'
import { Customer } from '@/lib/types'

export function useCustomers() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', [])

  const addCustomer = (customer: Customer) => {
    setCustomers([...(customers || []), customer])
  }

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers((customers || []).map((c) => c.id === customerId ? { ...c, ...updates, updatedAt: Date.now() } : c))
  }

  const deleteCustomer = (customerId: string) => {
    setCustomers((customers || []).filter((c) => c.id !== customerId))
  }

  const getCustomerById = (customerId: string): Customer | undefined => {
    return (customers || []).find((c) => c.id === customerId)
  }

  const findOrCreateCustomer = (customerName: string, innovationHubSPOC: string): Customer => {
    const allCustomers = customers || []
    const existing = allCustomers.find(
      (c) => c.name.toLowerCase().trim() === customerName.toLowerCase().trim()
    )
    
    if (existing) {
      if (existing.innovationHubSPOC !== innovationHubSPOC) {
        updateCustomer(existing.id, { innovationHubSPOC })
      }
      return existing
    }
    
    const newCustomer: Customer = {
      id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: customerName,
      innovationHubSPOC,
      createdAt: Date.now(),
    }
    
    addCustomer(newCustomer)
    return newCustomer
  }

  const clearCustomers = () => {
    setCustomers([])
  }

  return {
    customers: customers || [],
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    findOrCreateCustomer,
    clearCustomers,
  }
}
