import Custom404 from "src/pages/404";

export default {
  title: "Pages/404",
  component: Custom404,
};

export const Custom404Page = () => <Custom404 />;
Custom404Page.parameters = {
  nextjs: {
    router: {
      asPath: "/404?pet=hazel",
    },
  },
};
