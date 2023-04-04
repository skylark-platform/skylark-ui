import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BsDot } from "react-icons/bs";

import { Button } from "src/components/button";
import Annie from "src/images/pets/annie.png";
import Atticus from "src/images/pets/atticus.png";
import Hazel from "src/images/pets/hazel.png";
import Nora from "src/images/pets/nora.png";

import Logo from "public/images/skylark.png";

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
  {
    src: Nora,
    alt: "Nora",
  },
];

export default function BetaClosed() {
  const [pet, setPet] = useState<{ src: StaticImageData; alt: string }>();
  const { asPath } = useRouter();

  useEffect(() => {
    // Workaround for the router.query parameter not being set on the 404 page
    if (asPath && asPath.includes("pet=")) {
      const queryPet = asPath.split("pet=")[1];
      const index = pets.findIndex(
        ({ alt }) => alt.toLowerCase() === queryPet.toLowerCase(),
      );

      if (index >= 0) {
        setPet(pets[index]);
        return;
      }
    }

    const rand = Math.random();
    const index = Math.floor(rand * pets.length);
    setPet(pets[index]);
  }, [asPath]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center px-4 md:flex-row md:space-x-4">
      <div className="flex max-w-xl flex-col items-center justify-center">
        <div className="mb-10 flex flex-col items-center justify-start md:mb-20 md:flex-row">
          <Image
            src={Logo}
            alt="Skylark Logo"
            width="100"
            height="100"
            className="mb-4"
          />
          <h1 className="font-heading text-6xl font-bold md:ml-8 md:text-8xl">
            Skylark
          </h1>
        </div>
        <p className="mb-2 text-center text-xl font-bold text-gray-800 md:text-3xl">
          <span className="text-brand-primary">{`Sorry!`}</span>
          {` The Beta has now ended`}
        </p>
        <p className="mb-4 mt-6 text-center text-gray-500 md:mb-8 md:text-lg">
          {`Thanks for your participation. If you would like a further demonstration of the new Skylark then please contact `}
          <a
            href="mailto:customer-success@skylarkplatform.com"
            className="block text-brand-primary"
          >
            customer-success@skylarkplatform.com
          </a>
        </p>
        <div className="flex items-center justify-center space-x-1 text-gray-500 md:text-lg">
          <a
            href="https://docs.skylarkplatform.com/docs"
            className="transition-colors hover:text-brand-primary"
            rel="noreferrer nofollow"
            target="_blank"
          >
            API Documentation
          </a>
          <BsDot />
          <a
            href="https://github.com/skylark-platform"
            className="transition-colors hover:text-brand-primary"
            rel="noreferrer nofollow"
            target="_blank"
          >
            GitHub
          </a>
        </div>
        {/* <Button href="/" variant="primary" block>{`Go home`}</Button> */}
      </div>
      <div className="h-36 md:h-96 md:w-96">
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
              width={200}
              height={200}
              className="chromatic-ignore my-6 md:hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}
