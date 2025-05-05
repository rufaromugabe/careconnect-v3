import { ReactNode, useState } from "react"
import { Bell, Search, User, ChevronDown, X, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface HeaderProps {
  title: string
  actions?: ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, content: "New appointment request", read: false, time: "5m ago" },
    { id: 2, content: "Your prescription has been approved", read: false, time: "1h ago" },
    { id: 3, content: "Reminder: Follow-up appointment tomorrow", read: true, time: "3h ago" },
  ])
  const { user, signOut } = useAuth()
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="bg-muted/50 border-b sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative w-7 h-7 hidden sm:block">
            <Image 
              src="/logo.png" 
              alt="CareConnect Logo" 
              fill
              className="object-contain" 
            />
          </div>
          {!showSearch ? (
            <h1 className="text-2xl font-bold">{title}</h1>
          ) : null}
          
          {/* Search Widget */}
          <AnimatePresence>
            {showSearch && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }} 
                animate={{ width: "100%", opacity: 1 }} 
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-8"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button 
                  onClick={() => setShowSearch(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Toggle Button */}
          {!showSearch && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSearch(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {/* Theme Toggle Widget */}
          <ThemeToggle />
          
          {/* Notification Widget */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={cn(
                      "flex flex-col items-start p-3 cursor-pointer",
                      !notification.read && "bg-muted/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{notification.content}</span>
                      {!notification.read && (
                        <Badge variant="default" className="ml-2">New</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile Widget */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative flex items-center gap-2 text-sm">
                <Avatar className="h-8 w-8">
                  <User className="h-4 w-4" />
                </Avatar>
                <div className="hidden md:block text-left">
                  <span className="font-medium">{user?.email?.split('@')[0] || 'User'}</span>
                </div>
                <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => signOut()}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Additional actions passed as props */}
          {actions && (
            <div className="flex items-center ml-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
