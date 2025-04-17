import { useState, useEffect, useRef } from 'react';

interface InViewOptions {
  /**
   * The root element to use as the viewport
   */
  root?: Element | null;
  
  /**
   * Margin around the root element
   */
  rootMargin?: string;
  
  /**
   * Threshold(s) at which the callback is invoked
   */
  threshold?: number | number[];
  
  /**
   * Whether to disconnect the observer after the element enters the viewport
   */
  once?: boolean;
}

/**
 * Custom hook that tracks if an element is in the viewport
 */
export function useInView({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  once = false,
}: InViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    // Don't re-observe if element has been in view and once is true
    if (once && hasBeenInView) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          setHasBeenInView(true);
          
          // Disconnect observer if once is true
          if (once && observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      { root, rootMargin, threshold }
    );
    
    observerRef.current = observer;
    
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, once, hasBeenInView]);
  
  // Callback ref pattern to get the DOM node
  const ref = (node: Element | null) => {
    if (node) {
      targetRef.current = node;
      
      // If we already have an observer, disconnect it
      if (observerRef.current) {
        observerRef.current.disconnect();
        
        // If the element hasn't been in view or once is false, observe the new node
        if (!hasBeenInView || !once) {
          observerRef.current.observe(node);
        }
      }
    } else {
      targetRef.current = null;
    }
  };
  
  return { ref, isInView, hasBeenInView };
}