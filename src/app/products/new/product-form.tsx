"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createProductAction, type ProductFormState } from "@/lib/product-actions";
import type { Category } from "@/lib/types";

const initialState: ProductFormState = {};

export function ProductForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createProductAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage error={state.error} />

      {/* 사진 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">사진 (선택)</span>
        <label className="grid aspect-4/3 w-full max-w-64 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-carrot-soft">
          {preview ? (
            // 미리보기는 브라우저 메모리의 blob 주소라 next/image 를 쓰지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="올릴 사진 미리보기"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm text-ink-soft">
              <span className="text-3xl" aria-hidden="true">
                📷
              </span>
              사진 고르기
            </span>
          )}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        <span className="text-xs text-ink-soft">JPG·PNG·WEBP·GIF, 5MB까지</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">제목</span>
        <input
          className="field"
          type="text"
          name="title"
          defaultValue={state.values?.title}
          placeholder="에어팟 프로 2세대"
          maxLength={60}
          required
        />
        <span className="text-xs text-ink-soft">
          같은 제목끼리 묶어서 최저가를 찾아요. 모델명을 정확히 적을수록 좋아요!
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">카테고리</span>
        <select
          className="field"
          name="category"
          defaultValue={state.values?.category ?? ""}
          required
        >
          <option value="" disabled>
            골라 주세요
          </option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.emoji} {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">가격 (원)</span>
        <input
          className="field"
          type="text"
          inputMode="numeric"
          name="price"
          defaultValue={state.values?.price}
          placeholder="0 을 적으면 나눔이에요"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">동네 (선택)</span>
        <input
          className="field"
          type="text"
          name="region"
          defaultValue={state.values?.region}
          placeholder="역삼동"
          maxLength={30}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">설명 (선택)</span>
        <textarea
          className="field min-h-32 resize-y"
          name="description"
          defaultValue={state.values?.description}
          placeholder="언제 샀는지, 상태는 어떤지 적어 주면 거래가 빨라져요."
          maxLength={2000}
        />
      </label>

      <SubmitButton pendingLabel="매물 올리는 중…">등록하기</SubmitButton>
    </form>
  );
}
