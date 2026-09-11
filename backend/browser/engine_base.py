"""
Abstract Base Class for AccessBridge Browser Engines
Provides uniform interface for Playwright and Simulated engines.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from backend.models.schemas import WebPageState

class BaseBrowserEngine(ABC):
    @abstractmethod
    async def navigate(self, url: str) -> WebPageState:
        pass

    @abstractmethod
    async def get_page_state(self) -> WebPageState:
        pass

    @abstractmethod
    async def get_accessibility_tree(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def type_text(self, target_id: str, text: str) -> bool:
        pass

    @abstractmethod
    async def click_element(self, target_id: str) -> bool:
        pass

    @abstractmethod
    async def select_option(self, target_id: str, value: str) -> bool:
        pass

    @abstractmethod
    async def get_value(self, target_id: str) -> Any:
        pass

    @abstractmethod
    async def focus_element(self, target_id: str) -> bool:
        pass

    @abstractmethod
    async def submit_form(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_screenshot_base64(self) -> Optional[str]:
        pass
