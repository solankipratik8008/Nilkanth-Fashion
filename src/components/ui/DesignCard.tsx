'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Star, Clock, Tag, Eye } from 'lucide-react';
import { Design } from '@/types';
import { formatPrice } from '@/utils/pricing';
import { cn } from '@/utils/cn';

interface DesignCardProps {
  design: Design;
  className?: string;
  wishlistIds?: string[];
  onWishlistToggle?: (id: string) => void;
}

export default function DesignCard({ design, className, wishlistIds = [], onWishlistToggle }: DesignCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isWishlisted = wishlistIds.includes(design.id);

  const complexityColor = {
    simple: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    complex: 'bg-orange-100 text-orange-700',
    premium: 'bg-purple-100 text-purple-700',
  }[design.complexity];

  return (
    <motion.div
      className={cn('group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300', className)}
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={design.images[0] || '/images/placeholder.svg'}
          alt={design.name}
          fill
          className={cn(
            'object-cover transition-all duration-700',
            hovered ? 'scale-110' : 'scale-100',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

        {/* Second image on hover */}
        {design.images[1] && hovered && (
          <Image
            src={design.images[1]}
            alt={`${design.name} alternate`}
            fill
            className="object-cover opacity-90 transition-opacity duration-300"
            sizes="(max-width: 640px) 100vw, 25vw"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {design.trending && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">🔥 Trending</span>
          )}
          {design.featured && (
            <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-bold rounded-full">⭐ Featured</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); onWishlistToggle?.(design.id); }}
          className={cn(
            'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
            isWishlisted
              ? 'bg-violet-500 text-white scale-110'
              : 'bg-white/80 text-gray-500 hover:bg-violet-50 hover:text-violet-500'
          )}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-white')} />
        </button>

        {/* Quick View */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <Link
            href={`/designs/${design.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/90 backdrop-blur text-gray-800 font-semibold text-sm rounded-xl hover:bg-white transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Design
          </Link>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/designs/${design.id}`} className="group/title">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover/title:text-violet-600 transition-colors line-clamp-2">
              {design.name}
            </h3>
          </Link>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn('w-3.5 h-3.5', star <= Math.round(design.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200')}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({design.reviewCount})</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', complexityColor)}>
            {design.complexity.charAt(0).toUpperCase() + design.complexity.slice(1)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {design.productionTime}d
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Starting from</span>
            <div className="text-lg font-bold text-violet-600">{formatPrice(design.basePrice)}</div>
          </div>
          <Link
            href={`/order/new?designId=${design.id}`}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-xs font-bold rounded-full hover:shadow-md hover:scale-105 transition-all"
          >
            Order
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
