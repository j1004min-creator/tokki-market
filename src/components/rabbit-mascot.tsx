type RabbitMascotProps = {
  /** 픽셀 크기 */
  size?: number;
  className?: string;
  /** 눈을 감고 웃는 표정 (가입 완료 등 기분 좋은 순간용) */
  happy?: boolean;
};

/** 토끼마켓 마스코트. 어디서나 같은 얼굴을 쓰려고 컴포넌트로 뺐다. */
export function RabbitMascot({
  size = 48,
  className,
  happy = false,
}: RabbitMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 귀 */}
      <path
        d="M17 22C14 18 12.5 12 14 7.5C15.2 4 18.4 4.6 19.3 8.2C20.2 11.8 20.6 17.6 20.4 21.2Z"
        fill="#fff"
        stroke="var(--line-strong)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M31 22C34 18 35.5 12 34 7.5C32.8 4 29.6 4.6 28.7 8.2C27.8 11.8 27.4 17.6 27.6 21.2Z"
        fill="#fff"
        stroke="var(--line-strong)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 19.5C15.6 16.4 14.9 12 15.8 9.2C16.4 7.4 17.7 7.8 18.2 10.1C18.8 12.7 19 16.6 18.9 19.2Z"
        fill="var(--rose-soft)"
      />
      <path
        d="M30.8 19.5C32.4 16.4 33.1 12 32.2 9.2C31.6 7.4 30.3 7.8 29.8 10.1C29.2 12.7 29 16.6 29.1 19.2Z"
        fill="var(--rose-soft)"
      />

      {/* 얼굴 */}
      <ellipse
        cx="24"
        cy="31"
        rx="13.5"
        ry="12"
        fill="#fff"
        stroke="var(--line-strong)"
        strokeWidth="1.4"
      />

      {/* 볼터치 */}
      <ellipse cx="15.5" cy="34" rx="3" ry="2.1" fill="var(--rose-soft)" />
      <ellipse cx="32.5" cy="34" rx="3" ry="2.1" fill="var(--rose-soft)" />

      {/* 눈 */}
      {happy ? (
        <>
          <path
            d="M17 29.5C18 28.2 20 28.2 21 29.5"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M27 29.5C28 28.2 30 28.2 31 29.5"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="19" cy="29.5" r="1.9" fill="var(--ink)" />
          <circle cx="29" cy="29.5" r="1.9" fill="var(--ink)" />
          <circle cx="19.6" cy="28.9" r="0.6" fill="#fff" />
          <circle cx="29.6" cy="28.9" r="0.6" fill="#fff" />
        </>
      )}

      {/* 코와 입 */}
      <path
        d="M24 33.2L22.6 34.6C22.2 35 22.5 35.7 23.1 35.7H24.9C25.5 35.7 25.8 35 25.4 34.6Z"
        fill="var(--rose)"
      />
      <path
        d="M24 35.8V37M24 37C23.2 38.2 21.8 38.2 21.2 37.2M24 37C24.8 38.2 26.2 38.2 26.8 37.2"
        stroke="var(--ink-soft)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 당근 아이콘. 배지나 목록 앞머리에 쓴다. */
export function CarrotIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.5 9.2L14.8 14.5C13.6 18.6 9.4 21.5 5.2 21.7C4.4 21.7 3.8 21.1 3.9 20.3C4.2 16.1 6.9 12 9.5 9.2Z"
        fill="var(--carrot)"
      />
      <path
        d="M14.2 8.8C15.2 6.6 17.4 5 19.9 4.8C20.1 7.3 18.8 9.6 16.7 10.8"
        stroke="var(--leaf)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.6 7.6C12.2 5.4 12.9 3.2 14.5 1.8C16 3.1 16.6 5.2 16.1 7.2"
        stroke="var(--leaf)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
