import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import Annie from "../images/pets/annie.png";
import Atticus from "../images/pets/atticus.png";
import Hazel from "../images/pets/hazel.png";

const pets = [
  {
    src: Hazel,
    alt: "Hazel",
  },
  {
    src: Atticus,
    alt: "Atticus",
  },
  {
    src: Annie,
    alt: "Annie",
  },
];

export default function Custom404() {
  const [pet, setPet] = useState<{ src: StaticImageData; alt: string }>();

  useEffect(() => {
    const rand = Math.random();
    const index = Math.floor(rand * pets.length);
    setPet(pets[index]);
  }, []);

  return (
    <div className="flex h-full w-full flex-col-reverse items-center justify-center px-4 md:flex-row md:gap-4">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-7xl font-bold md:text-9xl">404</h1>
        <p className="mb-2 text-center text-xl font-bold text-gray-800 md:text-3xl">
          <span className="text-brand-primary">{`Oops!`}</span>
          {` Page not found`}
        </p>
        <p className="mb-8 text-center text-gray-500 md:text-lg">
          {`The page you're looking for doesn't exist.`}
        </p>
        <Link
          href="/"
          className="bg-brand-primary px-6 py-2 text-sm font-semibold text-white"
        >
          {`Go home`}
        </Link>
      </div>
      <div className="md:h- h-80 md:h-96 md:w-96">
        {pet && (
          <>
            <Image
              src={pet.src}
              alt={`404 pet - ${pet.alt} desktop`}
              width={400}
              height={400}
              className="chromatic-ignore hidden md:block"
            />
            <Image
              src={pet.src}
              alt={`404 pet - ${pet.alt} mobile`}
              width={250}
              height={250}
              className="chromatic-ignore my-10 md:hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}
