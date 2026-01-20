import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/setting')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-4 w-4 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                ></path>
              </svg>
              Home
            </a>
          </li>
          <li>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-4 w-4 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                ></path>
              </svg>
              Documents
            </a>
          </li>
          <li>
            <span className="inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-4 w-4 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Add Document
            </span>
          </li>
        </ul>
      </div>

      <div className="carousel carousel-vertical rounded-box h-96">
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.webp" />
        </div>
        <div className="carousel-item h-full">
          <img src="https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.webp" />
        </div>
      </div>

      <div className="flex w-52 flex-col gap-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-4 w-28"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
      </div>

      <input
        type="text"
        className="input pika-single"
        defaultValue="Pick a date"
      />

      <form>
        <input
          className="btn"
          type="checkbox"
          name="frameworks"
          aria-label="Svelte"
        />
        <input
          className="btn"
          type="checkbox"
          name="frameworks"
          aria-label="Vue"
        />
        <input
          className="btn"
          type="checkbox"
          name="frameworks"
          aria-label="React"
        />
        <input className="btn btn-square" type="reset" value="×" />
      </form>

      <div className="rating">
        <input
          type="radio"
          name="rating-2"
          className="mask mask-star-2 bg-orange-400"
          aria-label="1 star"
        />
        <input
          type="radio"
          name="rating-2"
          className="mask mask-star-2 bg-orange-400"
          aria-label="2 star"
          defaultChecked
        />
        <input
          type="radio"
          name="rating-2"
          className="mask mask-star-2 bg-orange-400"
          aria-label="3 star"
        />
        <input
          type="radio"
          name="rating-2"
          className="mask mask-star-2 bg-orange-400"
          aria-label="4 star"
        />
        <input
          type="radio"
          name="rating-2"
          className="mask mask-star-2 bg-orange-400"
          aria-label="5 star"
        />
      </div>
    </div>
  );
}
