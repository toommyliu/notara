'use client'

import { CalloutPlugin } from '@platejs/callout/react'

import { CalloutElement } from '~/features/editor/components/callout-node'

export const CalloutKit = [CalloutPlugin.withComponent(CalloutElement)]
