"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TitlePageProps {
  title: string;
  subtitle?: string;
  authorName?: string;
  publisherName?: string;
  publisherLocation?: string;
  className?: string;
}

export function TitlePage({
  title,
  subtitle,
  authorName,
  publisherName,
  publisherLocation,
  className,
}: TitlePageProps) {
  return (
    <Card className={cn("border-none shadow-none bg-transparent", className)}>
      <CardContent className="flex flex-col items-center justify-center min-h-[600px] p-12 text-center">
        <div className="space-y-8 max-w-2xl">
          {/* Copyright Notice */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Copyrighted Material
          </p>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-muted-foreground italic">{subtitle}</p>
            )}
          </div>

          {/* Author */}
          {authorName && (
            <p className="text-lg font-normal tracking-wide">{authorName}</p>
          )}

          {/* Spacer */}
          <div className="h-24" />

          {/* Publisher */}
          {publisherName && (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto mb-4 bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-xl">U</span>
              </div>
              <p className="font-semibold text-base">{publisherName}</p>
              {publisherLocation && (
                <p className="text-sm text-muted-foreground">
                  {publisherLocation}
                </p>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Copyrighted Material
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
