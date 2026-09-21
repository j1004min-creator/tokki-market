"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ProductFormState } from "@/lib/product-actions";
import type { Category } from "@/lib/types";

const initialState: ProductFormState = {};

export type ProductFormAction = (
  state: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

/**
 * 매물 등록과 수정이 같이 쓰는 폼.
 * 다른 건 "어떤 서버 액션을 부르느냐"와 기존 값이 있느냐뿐이라 한 곳에 모았다.
 */
export function ProductForm({
  action,
  categories,
  defaultValues,
  productId,
  currentImageUrl,
  submitLabel,
  pendingLabel,
  cancelHref,
}: {
  action: ProductFormAction;
  categories: Category[];
  defaultValues?: ProductFormState["values"];
  /** 수정일 때만 넘어온다 */
  productId?: string;
  currentImageUrl?: string | null;
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // 전송에 실패했으면 방금 입력한 값을, 아니면 원래 값을 보여 준다
  const values = state.values ?? defaultValues;
  const isEdit = Boolean(productId);
  const showCurrentImage = Boolean(currentImageUrl) && !preview && !removeImage;

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoveImage(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {productId && <input type="hidden" name="productId" value={productId} />}

      <FormMessage error={state.error} />

      {/* 사진 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">
          사진 {isEdit ? "(그대로 두려면 건드리지 마세요)" : "(선택)"}
        </span>

        <label className="relative grid aspect-4/3 w-full max-w-64 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-carrot-soft">
          {preview ? (
            // 미리보기는 브라우저 메모리의 blob 주소라 next/image 를 쓰지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="올릴 사진 미리보기"
              className="h-full w-full object-cover"
            />
          ) : showCurrentImage ? (
            <Image
              src={currentImageUrl!}
              alt="지금 올라가 있는 사진"
              fill
              sizes="256px"
              className="object-cover"
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

        {isEdit && currentImageUrl && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="removeImage"
              value="1"
              checked={removeImage}
              onChange={(event) => {
                setRemoveImage(event.target.checked);
                if (event.target.checked) setPreview(null);
              }}
              className="h-4 w-4 accent-[var(--carrot)]"
            />
            사진 지우고 이모지로 보여 주기
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">제목</span>
        <input
          className="field"
          type="text"
          name="title"
          defaultValue={values?.title}
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
          defaultValue={values?.category ?? ""}
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
          defaultValue={values?.price}
          placeholder="0 을 적으면 나눔이에요"
          required
        />
      </label>

      {isEdit && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-ink">거래 상태</legend>
          <div className="flex gap-2">
            {[
              { value: "selling", label: "판매중", hint: "누구나 살 수 있어요" },
              { value: "reserved", label: "예약중", hint: "잠시 구매를 막아요" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex flex-1 cursor-pointer items-start gap-2 rounded-xl border border-line-strong px-3 py-2.5 has-checked:border-carrot has-checked:bg-carrot-soft"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  defaultChecked={(values?.status ?? "selling") === option.value}
                  className="mt-0.5 h-4 w-4 accent-[var(--carrot)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {option.label}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">동네 (선택)</span>
        <input
          className="field"
          type="text"
          name="region"
          defaultValue={values?.region}
          placeholder="역삼동"
          maxLength={30}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">설명 (선택)</span>
        <textarea
          className="field min-h-32 resize-y"
          name="description"
          defaultValue={values?.description}
          placeholder="언제 샀는지, 상태는 어떤지 적어 주면 거래가 빨라져요."
          maxLength={2000}
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <div className="flex-1">
          <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
        </div>
        {cancelHref && (
          <Link href={cancelHref} className="btn-ghost flex-1">
            취소
          </Link>
        )}
      </div>
    </form>
  );
}
