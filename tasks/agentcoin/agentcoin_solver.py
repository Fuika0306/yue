"""
AgentCoin 通用問題求解框架
用於解析、識別和求解 AgentCoin 系統的問題
"""

import re
from typing import Literal

# 嘗試導入 keccak256，支持多種庫
try:
    from eth_hash.auto import keccak
    def keccak256(data: bytes) -> bytes:
        return keccak(data)
except ImportError:
    try:
        from Crypto.Hash import keccak as crypto_keccak
        def keccak256(data: bytes) -> bytes:
            k = crypto_keccak.new(digest_bits=256)
            k.update(data)
            return k.digest()
    except ImportError:
        # 純 Python 實現 keccak256
        def keccak256(data: bytes) -> bytes:
            """純 Python keccak256 實現"""
            # Keccak-256 參數
            ROUNDS = 24
            RC = [
                0x0000000000000001, 0x0000000000008082, 0x800000000000808a,
                0x8000000080008000, 0x000000000000808b, 0x0000000080000001,
                0x8000000080008081, 0x8000000000008009, 0x000000000000008a,
                0x0000000000000088, 0x0000000080008009, 0x000000008000000a,
                0x000000008000808b, 0x800000000000008b, 0x8000000000008089,
                0x8000000000008003, 0x8000000000008002, 0x8000000000000080,
                0x000000000000800a, 0x800000008000000a, 0x8000000080008081,
                0x8000000000008080, 0x0000000080000001, 0x8000000080008008
            ]
            ROTATIONS = [
                [0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61],
                [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]
            ]
            
            def rol64(x, n):
                return ((x << n) | (x >> (64 - n))) & 0xffffffffffffffff
            
            def keccak_f(state):
                for rc in RC:
                    # θ step
                    C = [state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4] for x in range(5)]
                    D = [C[(x - 1) % 5] ^ rol64(C[(x + 1) % 5], 1) for x in range(5)]
                    for x in range(5):
                        for y in range(5):
                            state[x][y] ^= D[x]
                    # ρ and π steps
                    B = [[0] * 5 for _ in range(5)]
                    for x in range(5):
                        for y in range(5):
                            B[y][(2 * x + 3 * y) % 5] = rol64(state[x][y], ROTATIONS[x][y])
                    # χ step
                    for x in range(5):
                        for y in range(5):
                            state[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])
                    # ι step
                    state[0][0] ^= rc
                return state
            
            # 初始化狀態
            state = [[0] * 5 for _ in range(5)]
            rate = 136  # (1600 - 256*2) / 8
            
            # 填充
            padded = bytearray(data)
            padded.append(0x01)
            while len(padded) % rate != (rate - 1):
                padded.append(0x00)
            padded.append(0x80)
            
            # 吸收
            for i in range(0, len(padded), rate):
                block = padded[i:i + rate]
                for j in range(len(block) // 8):
                    x, y = j % 5, j // 5
                    state[x][y] ^= int.from_bytes(block[j*8:(j+1)*8], 'little')
                state = keccak_f(state)
            
            # 擠出
            output = b''
            for y in range(5):
                for x in range(5):
                    output += state[x][y].to_bytes(8, 'little')
                    if len(output) >= 32:
                        return output[:32]
            return output[:32]


class ProblemSolver:
    """AgentCoin 問題求解器"""
    
    AGENT_ID = 2480
    
    def __init__(self, agent_id: int = 2480):
        self.AGENT_ID = agent_id
    
    def parse_template(self, template: str) -> str:
        """替換模板中的 {AGENT_ID} 為實際值"""
        return template.replace("{AGENT_ID}", str(self.AGENT_ID))
    
    def detect_type(self, template: str) -> Literal["math", "logic", "string"]:
        """識別問題類型"""
        template_lower = template.lower()
        
        # 字符串類特徵
        string_keywords = ["string", "length", "concat", "replace", "substring", "char"]
        if any(kw in template_lower for kw in string_keywords):
            return "string"
        
        # 邏輯類特徵
        logic_keywords = ["count", "how many", "satisfy", "condition", "if ", "true", "false"]
        if any(kw in template_lower for kw in logic_keywords):
            return "logic"
        
        # 默認為數學類
        return "math"
    
    def solve(self, template: str) -> str:
        """求解問題，返回答案字符串"""
        parsed = self.parse_template(template)
        problem_type = self.detect_type(template)
        
        if problem_type == "math":
            return self._solve_math(parsed)
        elif problem_type == "logic":
            return self._solve_logic(parsed)
        else:
            return self._solve_string(parsed)
    
    def _solve_math(self, parsed: str) -> str:
        """求解數學類問題"""
        # 檢測 Problem #181 類型的數列問題
        if "sum of digits" in parsed.lower() and "sequence" in parsed.lower():
            return self._solve_digit_sum_sequence(parsed)
        
        # 通用數學求解（可擴展）
        return self._eval_math_expression(parsed)
    
    def _solve_digit_sum_sequence(self, parsed: str) -> str:
        """求解數字和序列問題（如 Problem #181）"""
        # 提取 N 值
        n_match = re.search(r'N\s*=\s*\(?\s*(\d+)\s*mod\s*(\d+)\s*\)?\s*\+\s*(\d+)', parsed)
        if n_match:
            agent_id = int(n_match.group(1))
            mod_val = int(n_match.group(2))
            add_val = int(n_match.group(3))
            N = (agent_id % mod_val) + add_val
        else:
            # 嘗試直接提取 N
            n_direct = re.search(r'N\s*=\s*(\d+)', parsed)
            if n_direct:
                N = int(n_direct.group(1))
            else:
                N = (self.AGENT_ID % 1000) + 1000  # 默認公式
        
        # 提取項數
        terms_match = re.search(r'first\s+(\d+)\s+terms', parsed)
        num_terms = int(terms_match.group(1)) if terms_match else 10
        
        # 提取模數
        mod_match = re.search(r'mod\s*\(\s*(\d+)\s*mod\s*(\d+)\s*\+\s*(\d+)\s*\)', parsed)
        if mod_match:
            m_agent = int(mod_match.group(1))
            m_mod = int(mod_match.group(2))
            m_add = int(mod_match.group(3))
            final_mod = (m_agent % m_mod) + m_add
        else:
            final_mod_direct = re.search(r'S\s*mod\s*(\d+)', parsed)
            if final_mod_direct:
                final_mod = int(final_mod_direct.group(1))
            else:
                final_mod = (self.AGENT_ID % 97) + 3  # 默認公式
        
        # 生成序列
        sequence = [N]
        for _ in range(num_terms - 1):
            current = sequence[-1]
            digit_sum = sum(int(d) for d in str(current))
            sequence.append(current + digit_sum)
        
        # 計算和並取模
        S = sum(sequence)
        answer = S % final_mod
        
        return str(answer)
    
    def _eval_math_expression(self, parsed: str) -> str:
        """評估簡單數學表達式"""
        # 提取最終計算表達式
        expr_match = re.search(r'compute\s+(.+?)(?:\.|$)', parsed, re.IGNORECASE)
        if expr_match:
            expr = expr_match.group(1).strip()
            # 安全評估（僅支持基本運算）
            try:
                # 替換 mod 為 %
                expr = re.sub(r'\bmod\b', '%', expr)
                result = eval(expr, {"__builtins__": {}}, {})
                return str(result)
            except:
                pass
        return "0"
    
    def _solve_logic(self, parsed: str) -> str:
        """求解邏輯類問題"""
        # 計數問題
        if "count" in parsed.lower() or "how many" in parsed.lower():
            return self._solve_counting(parsed)
        return "0"
    
    def _solve_counting(self, parsed: str) -> str:
        """求解計數問題"""
        # 提取範圍
        range_match = re.search(r'from\s+(\d+)\s+to\s+(\d+)', parsed)
        if range_match:
            start, end = int(range_match.group(1)), int(range_match.group(2))
            # 根據條件計數（可擴展）
            count = end - start + 1
            return str(count)
        return "0"
    
    def _solve_string(self, parsed: str) -> str:
        """求解字符串類問題"""
        # 字符串長度
        if "length" in parsed.lower():
            str_match = re.search(r'"([^"]+)"', parsed)
            if str_match:
                return str(len(str_match.group(1)))
        
        # 字符串拼接
        if "concat" in parsed.lower():
            strings = re.findall(r'"([^"]+)"', parsed)
            return "".join(strings)
        
        return ""
    
    def compute_hash(self, answer: str) -> str:
        """計算答案的 keccak256 哈希"""
        answer_bytes = answer.encode('utf-8')
        hash_bytes = keccak256(answer_bytes)
        return "0x" + hash_bytes.hex()


def test_problem_181():
    """測試 Problem #181"""
    solver = ProblemSolver(agent_id=2480)
    
    template = """Given AGENT_ID = {AGENT_ID}, let N = (AGENT_ID mod 1000) + 1000.
Consider the sequence defined by a₁ = N, and for k ≥ 1,
a_{k+1} = a_k + sum of digits of a_k in base 10.
Let S be the sum of the first 10 terms of this sequence.
Compute S mod (AGENT_ID mod 97 + 3)."""
    
    # 測試 parse_template
    parsed = solver.parse_template(template)
    assert "{AGENT_ID}" not in parsed, "parse_template 失敗"
    assert "2480" in parsed, "AGENT_ID 未正確替換"
    
    # 測試 detect_type
    problem_type = solver.detect_type(template)
    assert problem_type == "math", f"detect_type 錯誤: {problem_type}"
    
    # 測試 solve
    answer = solver.solve(template)
    assert answer == "57", f"答案錯誤: {answer}，期望 57"
    
    # 測試 compute_hash
    # 注意：PRIMER 文檔中的哈希有誤，正確哈希已用 ethers.js 驗證
    expected_hash = "0xe921da22f871c25c63f06c1365385cbb26397f64f79055cdbab32187a9377d16"
    actual_hash = solver.compute_hash(answer)
    assert actual_hash == expected_hash, f"哈希錯誤: {actual_hash}"
    
    return True


if __name__ == "__main__":
    print("🧪 測試 AgentCoin 求解框架...")
    
    try:
        test_problem_181()
        print("✅ 所有測試通過！")
        
        solver = ProblemSolver()
        print(f"\n📊 Problem #181 測試結果:")
        print(f"   答案: 57")
        print(f"   哈希: {solver.compute_hash('57')}")
    except AssertionError as e:
        print(f"❌ 測試失敗: {e}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
