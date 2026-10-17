import MyDay from "./MyDay";

/** Reports → My day: follow-ups, orders to dispatch, money due, stock alerts. */
export default function MyDayPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <MyDay />
      </div>
    </div>
  );
}
