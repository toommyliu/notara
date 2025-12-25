import { useEffect, useState } from "react";
import { type Block } from "~/features/notes/store";

export function useActiveHeading(blocks: Block[]) {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        const headings = blocks.filter(
            (b) => b.type === "h1" || b.type === "h2" || b.type === "h3"
        );

        if (headings.length === 0) {
            setActiveId(null);
            return;
        }

        const observerOptions = {
            root: null, // use viewport
            rootMargin: "-20% 0px -70% 0px", // look at the upper-middle of the screen
            threshold: [0, 1.0],
        };

        const observer = new IntersectionObserver((entries) => {
            // Find the heading that is closest to the top of the viewing area
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, observerOptions);

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [blocks]);

    return activeId;
}
