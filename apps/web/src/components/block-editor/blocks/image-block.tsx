"use client";

import { useState } from "react";
import type { Block } from "../block-editor-context";
import { useMutation } from "convex/react";
import { api } from "@book-ai/backend/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export function ImageBlock({
  block,
  editable = false,
}: {
  block: Block;
  editable?: boolean;
}) {
  const updateBlock = useMutation(api.features.books.updateBlock);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(block.blockData?.caption || "");

  const imageUrl = block.blockData?.url;
  const imageAlt = block.blockData?.alt || "";
  const alignment = block.blockData?.alignment || "center";
  const width = block.blockData?.width || "100%";

  const handleSaveCaption = () => {
    updateBlock({
      blockId: block._id,
      blockData: {
        ...block.blockData,
        caption,
      },
    }).catch(console.error);
    setIsEditing(false);
  };

  const alignmentClasses = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };

  if (!imageUrl) {
    return (
      <div className="image-block my-4 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-4">
        <Upload className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-sm font-medium">No image uploaded</p>
          <p className="text-xs text-muted-foreground">
            Image upload functionality will be added in Phase 3
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="image-block my-4"
      style={{
        marginTop: block.styling?.marginTop,
        marginBottom: block.styling?.marginBottom,
      }}
    >
      <div
        className={cn(
          "relative",
          alignmentClasses[alignment as keyof typeof alignmentClasses]
        )}
        style={{ width }}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Caption */}
        <div className="mt-2">
          {isEditing && editable ? (
            <div className="space-y-2">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveCaption}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCaption(block.blockData?.caption || "");
                    setIsEditing(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm text-muted-foreground text-center italic",
                editable && "cursor-pointer hover:text-foreground"
              )}
              onClick={() => editable && setIsEditing(true)}
            >
              {caption || (editable ? "Click to add caption" : "")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
