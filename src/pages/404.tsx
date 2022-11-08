import Image from "next/image";
import Link from "next/link";

import Hazel from "../images/hazel.png";

export default function Custom404() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 lg:py-12 md:gap-4 flex flex-col md:flex-row items-center justify-center w-full h-full">
        <div className="flex flex-col items-center justify-center md:py-24 lg:py-32">
          <h1 className="font-bold text-7xl md:text-9xl">404</h1>
          <p className="mb-2 text-xl font-bold text-center text-gray-800 md:text-3xl">
            <span className="text-brand-primary">{`Oops!`}</span>
            {` Page not found`}
          </p>
          <p className="mb-8 text-center text-gray-500 md:text-lg">
            {`The page you're looking for doesn't exist.`}
          </p>
          <Link
            href="/"
            className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary"
          >
            {`Go home`}
          </Link>
        </div>
        <Image
          src={Hazel}
          alt="Dog"
          width={400}
          height={400}
          className="hidden md:block"
        />
      </div>
    </div>
  );
}
