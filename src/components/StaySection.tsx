import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { roomData as staticRoomData } from "@/data/siteData";
import { useRoomsData } from "@/hooks/useSupabaseData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";

const RoomCard = ({ room, inView }: { room: any; inView: boolean }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = room.images?.length > 0 ? room.images : staticRoomData.images;
  const features = room.features?.length > 0 ? room.features : staticRoomData.features;

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((p) => (p + 1) % images.length);
  };
  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((p) => (p - 1 + images.length) % images.length);
  };

  return (
    <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-8`}>
      {/* Image slider */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <div className="aspect-[4/3] overflow-hidden rounded-sm">
          <img
            src={images[currentSlide]}
            alt={`${room.name || 'Room'} - view ${currentSlide + 1}`}
            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            loading="lazy"
          />
        </div>
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRight size={18} className="text-foreground" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {images.map((_: any, i: number) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-white w-4" : "bg-white/50"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>

      {/* Room details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-col gap-6"
      >
        <div>
          <h3 className="font-heading text-4xl md:text-5xl font-light mb-2">{room.name || staticRoomData.name}</h3>
          {room.price && (
            <p className="text-xl text-warm-gold">From ₹{room.price} / night</p>
          )}
        </div>
        <div className="gold-divider !mx-0" />
        <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed font-light whitespace-pre-line">
          {room.description || staticRoomData.description}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {features.map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
              <span className="font-body text-xs md:text-sm text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <a
            href="#"
            className="inline-block px-10 py-3.5 bg-primary text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium hover:bg-primary/90 transition-all duration-300"
          >
            Book Now
          </a>
        </div>
      </motion.div>
    </div>
  );
};

const StaySection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { data: rooms = [] } = useRoomsData();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const displayRooms = rooms.length > 0 ? rooms : [staticRoomData];

  return (
    <section id="stay" className="section-padding bg-background overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="font-body text-xs tracking-[0.3em] uppercase text-accent mb-4">Accommodation</p>
          <h2 className="section-heading">Our Rooms & Suites</h2>
          <div className="gold-divider mt-6" />
        </motion.div>

        <div className="relative group">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {displayRooms.map((room, index) => (
                <CarouselItem key={room.id || index} className="basis-full">
                  <div className="px-2">
                    <RoomCard room={room} inView={inView} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="hidden md:block">
              <CarouselPrevious className="left-0 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground" />
              <CarouselNext className="right-0 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground" />
            </div>
          </Carousel>

          {/* Custom Dots for Room Carousel */}
          <div className="flex justify-center gap-3 mt-12">
            {displayRooms.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`transition-all duration-500 rounded-full ${
                  i === current 
                    ? "w-10 h-1.5 bg-accent" 
                    : "w-1.5 h-1.5 bg-border hover:bg-accent/40"
                }`}
                aria-label={`Go to room ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaySection;
