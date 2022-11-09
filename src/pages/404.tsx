import Image from "next/image";
import Link from "next/link";

import Atticus from "../images/pets/atticus.png";
import Hazel from "../images/pets/hazel.png";

export default function Custom404() {
  const pets = [Hazel, Atticus];
  const randomPet = pets[Math.floor(Math.random() * pets.length)];

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
      <Image
        src={randomPet}
        alt="404 pet"
        width={400}
        height={400}
        className="chromatic-ignore hidden md:block"
      />
      <Image
        src={randomPet}
        alt="404 pet"
        width={250}
        height={250}
        className="chromatic-ignore my-10 md:hidden"
      />
    </div>
  );
}
