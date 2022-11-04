import Image from "next/image";
import Link from "next/link";
import Logo from "../../../../public/images/skylark.png";
import { UserAvatar } from "../../user";

const apps = [
  {
    text: "Import",
    href: "/import",
  },
  {
    text: "Relationship",
    href: "/relationship",
  },
  {
    text: "Content",
    href: "/content",
  },
];

const dummyUser = {
  name: "Joe Bloggs",
};

export const NavigationBar = () => {
  const activeHref = apps[0].href;

  return (
    <div className="bg-nav-bar w-full h-14 lg:h-16 flex justify-between items-center px-8 lg:px-14 text-sm font-sans text-black">
      <div className="flex items-center gap-8 md:gap-12 font-bold h-full">
        <div className="flex">
          <Image src={Logo} alt="Skylark Logo" width="30" height="30" />
          <p className="font-heading text-xl ml-3 lg:ml-4 hidden md:block">
            Skylark
          </p>
        </div>
        {apps.map(({ text, href }) => (
          // Use legacyBehaviour so we can style the a tag
          <Link key={href} href={href} legacyBehavior>
            <a
              className={`h-full flex items-center ${
                href !== activeHref ? "opacity-50 hover:opacity-100" : ""
              }`}
            >
              {text}
            </a>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-8 md:gap-12 font-semibold">
        <div>
          <p>Quick search</p>
        </div>
        <div className="flex items-center">
          <p className="hidden md:block mr-3 lg:mr-4">{dummyUser.name}</p>
          <UserAvatar name={dummyUser.name} src="" />
        </div>
      </div>
    </div>
  );
};
