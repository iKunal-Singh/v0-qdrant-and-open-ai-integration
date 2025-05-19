"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Github, Menu, X } from "lucide-react"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-primary-light/90 dark:bg-primary-dark/90 backdrop-blur-md py-3 shadow-md"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl tracking-wider text-text-light dark:text-text-dark">
            AGENT<span className="text-accent-light dark:text-accent-dark">DOC</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/"
                className="text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/chat"
                className="text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                Chat
              </Link>
            </li>
            <li>
              <Link
                href="/upload"
                className="text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                Upload
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/yourusername/agent-doc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Button variant="ghost" size="icon" className="rounded-full">
                <Github className="h-5 w-5 text-text-light dark:text-text-dark" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="https://github.com/yourusername/agent-doc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            <Button variant="ghost" size="icon" className="rounded-full">
              <Github className="h-5 w-5 text-text-light dark:text-text-dark" />
            </Button>
          </Link>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-text-light dark:text-text-dark" />
            ) : (
              <Menu className="h-6 w-6 text-text-light dark:text-text-dark" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-primary-light dark:bg-primary-dark shadow-lg animate-slide-in">
          <nav className="container py-5">
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/"
                  className="block py-2 text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="block py-2 text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  className="block py-2 text-text-light dark:text-text-dark hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Upload
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
