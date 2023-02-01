import { Reorder } from "framer-motion";
import { useState } from "react";

import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { ParsedSkylarkObjectContent } from "src/interfaces/skylark";

export const PanelContent = ({
  content,
}: {
  content: ParsedSkylarkObjectContent;
}) => {
  console.log({ content });

  const [order, setOrder] = useState(
    content.objects.map(({ object: { uid } }) => uid),
  );

  const [contentObjects, setContentObjects] = useState(content.objects);

  return (
    <div className="h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
      <Reorder.Group
        axis="y"
        values={contentObjects}
        onReorder={setContentObjects}
      >
        {contentObjects.map((item) => {
          const { object, config } = item;

          const primaryKey = [
            config.primaryField || "",
            ...DISPLAY_NAME_PRIORITY,
          ].find((field) => !!object[field]);
          return (
            <Reorder.Item
              key={`content-item-${object.uid}`}
              value={item}
              className="my-2 border p-2"
            >
              {primaryKey ? object[primaryKey] : object.uid}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {/* <Reorder.Group axis="y" values={order} onReorder={setOrder}>
        {order.map((uid) => {
          const { object, config } = content.objects.find(
            ({ object }) => object.uid === uid,
          ) as ParsedSkylarkObjectContent["objects"][0];

          const primaryKey = [
            config.primaryField || "",
            ...DISPLAY_NAME_PRIORITY,
          ].find((field) => !!object[field]);
          return (
            <Reorder.Item key={uid} value={uid}>
              {primaryKey ? object[primaryKey] : object.uid}
            </Reorder.Item>
          );
        })}
      </Reorder.Group> */}
    </div>
  );
};
