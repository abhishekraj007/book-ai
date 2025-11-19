"use client";

import { api } from "@book-ai/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookPrompt } from "@/components/book-prompt";
import {
  BookOpen,
  Sparkles,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const books = useQuery(api.features.books.index.listMyBooks);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "generating":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const recentBooks = books?.slice(0, 3) || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Hero Section - v0-style Book Creation */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <BookPrompt />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Dashboard Content */}
        <div className="container mx-auto p-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back,{" "}
              {userData?.profile?.name || userData?.userMetadata?.name}!
            </h2>
            <p className="text-muted-foreground">
              Here's an overview of your book generation activity
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Books
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books?.length ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Credits
                </CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userData?.profile?.credits ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
                <Loader2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {books?.filter((b) => b.status === "generating").length ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Books */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Your Books</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Recent books and their generation status
                </p>
              </div>
              {books && books.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/books")}
                  className="gap-2"
                >
                  View All
                </Button>
              )}
            </div>

            {books === undefined && (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {books && books.length === 0 && (
              <Card className="text-center py-12 border-dashed">
                <CardContent className="pt-6">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No books yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the prompt above to create your first AI-generated book
                  </p>
                </CardContent>
              </Card>
            )}

            {recentBooks.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {recentBooks.map((book) => (
                  <Card
                    key={book._id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/books/${book._id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                          {book.title}
                        </CardTitle>
                        {getStatusIcon(book.status)}
                      </div>
                      <CardDescription className="capitalize">
                        {book.type.replace(/_/g, " ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium capitalize">
                            {book.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Credits:
                          </span>
                          <span className="font-medium">
                            {book.creditsUsed}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/books/${book._id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View Book
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
