import { ObjectImage } from "src/interfaces/skylark/objects";
import { formatObjectField } from "src/lib/utils";

export const PanelImages = ({ images }: { images: ObjectImage[] }) => {
  console.log("images", images);
  return (
    <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      {images.map((image) => (
        <div key={image.uid}>
          <h3 className="mb-2 font-bold">{formatObjectField(image.type)}</h3>
          <div className="flex flex-row">
            <div className="w-1/2">
              Title: {formatObjectField(image.title)}
              Description: {formatObjectField(image.description)}
            </div>
            <div className="w-1/2">
              <img
                className="max-h-72 w-full object-cover"
                src={image.url}
                alt="Picture of the author"
                // width={500}
                // height={500}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
